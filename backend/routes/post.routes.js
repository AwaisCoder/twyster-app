import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createPost } from "../controllers/post.controller.js";
import { deletePost } from "../controllers/post.controller.js";
import { commentOnPost } from "../controllers/post.controller.js";
import { likeUnlikePost } from "../controllers/post.controller.js";
import { getAllPosts } from "../controllers/post.controller.js";
import { getLikedPosts } from "../controllers/post.controller.js";
import { getFollowingPosts } from "../controllers/post.controller.js";
import { getUserPosts } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/all", protectRoute, getFollowingPosts);
router.get("/following", protectRoute, getAllPosts);
router.post("/create", protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/comment/:id", protectRoute, commentOnPost);

export default router;