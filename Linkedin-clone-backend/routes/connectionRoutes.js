const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const { sendConnectionRequest, acceptConnectionRequest, rejectConnectionRequest, getConnectionRequests, getUserConnections, removeConnection, getConnectionStatus } = require("../controllers/connectioncontroller");

router.post("/request/:userId", isLoggedIn, sendConnectionRequest);
router.put("/accept/:requestId", isLoggedIn, acceptConnectionRequest);
router.put("/reject/:requestId", isLoggedIn, rejectConnectionRequest);
router.get("/requests/", isLoggedIn, getConnectionRequests);
router.get("/", isLoggedIn, getUserConnections);
router.delete("/:userId", isLoggedIn, removeConnection);
router.get("/status/:userId", isLoggedIn, getConnectionStatus);

module.exports = router;