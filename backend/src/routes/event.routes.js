/**
 * Event Routes
 * Event-related routes
 */

const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event.controller");
const { authenticate } = require("../middlewares/auth.middleware");

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
router.post("/", authenticate, eventController.createEvent);

/**
 * @route   GET /api/events
 * @desc    Get all events for the current user
 * @access  Private
 */
router.get("/", authenticate, eventController.getUserEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Private
 */
router.get("/:id", authenticate, eventController.getEventById);

module.exports = router;




