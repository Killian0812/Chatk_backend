const { v4: uuidv4 } = require('uuid');
const streamServer = require('../stream');
const { FirebaseStorage } = require('../firebase');
const bucket = FirebaseStorage.bucket();
var User = require('../models/user.model');
var Group = require('../models/group.model');

const uploadToFirebaseStorage = async (file) => {
    var uuid = uuidv4();
    var imageURL = null;
    const remoteFile = bucket.file(uuid);
    await remoteFile.save(file.buffer, {
        contentType: file.mimetype,
        public: true,
    }).then(async () => {
        const downloadURL = await remoteFile.getSignedUrl({
            action: 'read',
            expires: '01-01-3000'
        });
        imageURL = downloadURL[0];
        console.log("File uploaded to Firebase");
    }).catch((err) => {
        console.log("Error uploading to Firebase: " + err);
    })
    return imageURL;
}

const handleFindUser = async (req, res) => {
    const keyword = req.query.keyword;
    console.log(keyword);
    console.log(`Finding user: ${keyword}`);
    const user = await User.findOne({ "username": { $regex: keyword, $options: 'i' } });
    return res.status(200).json(user);
}

const handleCreateGroup = async (req, res) => {
    console.log("creating group");

    let imageURL;
    const image = req.file;
    if (!image) {
        imageURL = `https://picsum.photos/200`; // random fallback img
    }
    else {
        // upload to firebase
        imageURL = await uploadToFirebaseStorage(image);
    }
    const members = JSON.parse(req.body?.members);
    const users = await User.find({ _id: { $in: members } });
    const usernames = users.map(user => user.username);
    if (!usernames.includes(req.username))
        usernames.push(req.username);

    // save to database then create a stream channel
    const newGroup = new Group({ groupName: req.body.groupName, image: imageURL, owner: req.userId, members: members });
    newGroup.save().then(async () => {
        const channelId = newGroup._id.toString()
        const channel = streamServer.channel('messaging', channelId, {
            created_by_id: req.username,
        });
        await channel.create();
        await channel.update({
            image: imageURL,
            name: req.body.groupName,
            isGroup: true
        });
        await channel.addMembers([...usernames]); // username as userId

        return res.status(200).json(newGroup);
    }).catch((err) => {
        console.log(err);
        return res.sendStatus(500);
    })
}

module.exports = { handleCreateGroup, handleFindUser }