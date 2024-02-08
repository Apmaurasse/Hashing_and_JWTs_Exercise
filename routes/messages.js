const Router = require("express").Router;
const Message = require("../models/message");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const message = await Message.get(req.params.id);
    const currentUser = req.user.username;

    // Check if the current user is either the sender or receiver of the message
    if (message.from_user.username !== currentUser && message.to_user.username !== currentUser) {
      throw new Error("Unauthorized access to message details");
    }

    return res.json({message});
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const {to_username, body} = req.body;
    const from_username = req.user.username;

    const message = await Message.create({from_username, to_username, body});
    return res.status(201).json({message});
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    const messageId = req.params.id;
    const currentUser = req.user.username;

    const message = await Message.get(messageId);

    // Check if the current user is the intended recipient of the message
    if (message.to_user.username !== currentUser) {
      throw new Error("Unauthorized to mark message as read");
    }

    const updatedMessage = await Message.markRead(messageId);
    return res.json({message: updatedMessage});
  } catch (err) {
    return next(err);
  }
});

module.exports = router;




