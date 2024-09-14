import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import {v2 as cloudinary} from "cloudinary";



export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        if(!text && !img) {
            return res.status(400).json({message: "Post must have text or image"});
        }   

        if(img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        });

        await newPost.save();
        res.status(201).json({message: "Post created successfully"});
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
        console.log("Error in createPost controller: ", error);
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({message: "Post not found"});
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({message: "You are not authorized to delete this post"});
        }

        if(post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Post deleted successfully"});

    } catch (error) {
        res.status(500).json({message: "Internal server error"});
        console.log("Error in deletePost controller: ", error);
    }
};

export const commentOnPost = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const postId = req.params.id;
        const post = await Post.findById(postId);
        const { text } = req.body;
        if (!post) {
            return res.status(404).json({message: "Post not found"});
        }

        if (!text) {
            return res.status(400).json({message: "Comment must have text"});
        }

        const comment = {
            user: userId,
            text,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);

    } catch (error) {
        res.status(500).json({message: "Internal server error"});
        console.log("Error in commentOnPost controller: ", error);
    }
};


export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const postId = req.params.id;

        // Find the post and populate the user field
        const post = await Post.findById(postId).populate('user');
        if (!post) {
            return res.status(404).json({message: "Post not found"});
        }

        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            // Unlike logic
            post.likes = post.likes.filter(id => id.toString() !== userId);
            await post.save(); // Save post after removing the like

            // Remove the like from the user's likedPosts
            await User.updateOne({_id: userId}, {$pull: {likedPosts: postId}});

            // Optionally remove notification
            await Notification.findOneAndDelete({ from: userId, to: post.user._id, type: "like" });

        } else {
            // Like logic
            post.likes.push(userId);
            await post.save(); // Save post after adding the like

            // Add the post to the user's likedPosts
            await User.updateOne({_id: userId}, {$push: {likedPosts: postId}});

            // Create a new notification
            const newNotification = new Notification({
                from: userId,
                to: post.user._id,
                type: "like"
            });
            await newNotification.save();
        }

        // Return the updated post
        res.status(200).json(post);

    } catch (error) {
        console.error("Error in likeUnlikePost controller: ", error);
        res.status(500).json({message: "Internal server error"});
    }
};


export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password" // Exclude password for the main user
            })
            .populate({
                path: "comments.user",
                select: "-password -email -bio" // Exclude password, email, and bio for commented users
            });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ message: "No posts found" });
        }
        
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
        console.log("Error in getAllPosts controller: ", error);
    }
};

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        // Find the user to get their liked posts
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find posts liked by the user and populate user info
        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user", // Populate the user who created the post
                select: "-password", // Exclude password
            })
            .populate({
                path: "comments.user", // Populate the users who made comments
                select: "-password", // Exclude password
            });

        res.status(200).json(likedPosts);
        
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const following = user.following;

        // Find posts by users in the following list
        const feedPosts = await Post.find({ user: { $in: user.following } })
            .sort({ createdAt: -1 })
            .populate({ 
                path: "user", 
                select: "-password" 
            })
            .populate({
                path: "comments.user",
                select: "-password", 
            })

            res.status(200).json(feedPosts);

    } catch (error) { 
        console.log("Error in getFollowingPosts controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate({
                path: "user",
                select: "-password"
            }).populate({
                path: "comments.user",
                select: "-password"
            });

            res.status(200).json(posts);

    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};