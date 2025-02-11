const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const Notification = require("../models/notifications");
const { sendConnectionAcceptedEmail } = require("../emails/emailHandlers");


// send connection request route:-
const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user._id;

    if (senderId.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You can't send a request to yourself." });
    }

    if (req.user.connections.includes(userId)) {
      return res.status(400).json({ message: "You are already connected" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      sender: senderId,
      recipient: userId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const newRequest = new ConnectionRequest({
      sender: senderId,
      recipient: userId,
    });

    await newRequest.save();
    res.status(201).json({ message: "Connection request sent successfully" });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// accept connection request route:-
const acceptConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findByIdAndUpdate(requestId)
      .populate("sender", "firstName email userName")
      .populate("recipient", "firstName userName");

    if (!request) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // check if the req is for the current user
    if (request.recipient._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to accept this request" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request already been processed" });
    }
    request.status = "accepted";

    await request.save();

    // update connections in both users
    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: { connections: userId },
    });
    await User.findByIdAndUpdate(request.recipient._id, {
      $addToSet: { connections: request.sender._id },
    });

    // create a notification for the sender
    const notification = new Notification({
      recipient: request.sender._id,
      type: "connectionAccepted",
      relatedUser: userId,
    });

    await notification.save();
    res
      .status(200)
      .json({ message: "Connection request accepted successfully" }

    );

    // send email notification to the sender
    const senderEmail = request.sender.email;
    const senderName = request.sender.firstName;
    const recipientName = request.recipient.firstName;

    const profileUrl =
      process.env.CLIENT_URL + "/profile/" + request.recipient.userName;
    try {
      await sendConnectionAcceptedEmail(
        senderEmail,
        senderName,
        recipientName,
        profileUrl
      );
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  } catch (error) {
    console.error("Error accepting connection request:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// reject connection request route:-
const rejectConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ConnectionRequest.findById(requestId);

    if (request.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to reject this request" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This request has already been processed" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Connection request rejected" });
  } catch (error) {
    console.error("Error in rejectConnectionRequest controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// get connection request route:-
const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await ConnectionRequest.find({
      recipient: userId,
      status: "pending",
    }).populate(
      "sender",
      "firstName userName profilePicture headline connections"
    );

    res.json(requests);
  } catch (error) {
    console.error("Error in getConnectionRequests controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// get user connection route:-
const getUserConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "connections",
      "firstName userName profilePicture headline connections"
    );

    res.json(user.connections);
  } catch (error) {
    console.error("Error in getUserConnections controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// remove connection route:-
const removeConnection = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    await User.findByIdAndUpdate(myId, { $pull: { connections: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { connections: myId } });

    res.json({ message: "Connection removed successfully" });
  } catch (error) {
    console.error("Error in removeConnection controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// get connection status route:-
const getConnectionStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = req.user;
    if (currentUser.connections.includes(targetUserId)) {
      return res.json({ status: "connected" });
    }

    const pendingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
      status: "pending",
    });

    if (pendingRequest) {
      if (pendingRequest.sender.toString() === currentUserId.toString()) {
        return res.json({ status: "pending" });
      } else {
        return res.json({ status: "received", requestId: pendingRequest._id });
      }
    }

    // if no connection or pending req found
    res.json({ status: "not_connected" });
  } catch (error) {
    console.error("Error in getConnectionStatus controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  getUserConnections,
  rejectConnectionRequest,
  getConnectionRequests,
  removeConnection,
  getConnectionStatus,
};