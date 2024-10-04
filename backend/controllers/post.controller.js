import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";



export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!text && !img) {
            return res.status(400).json({ message: "Post must have text or image" });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        });

        await newPost.save();
        res.status(201).json({ message: "Post created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
        console.log("Error in createPost controller: ", error);
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id.toString();

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the owner of the post
        if (post.user.toString() !== userId) {
            return res.status(401).json({ message: "You are not authorized to delete this post" });
        }

        // If the post is a retweet, handle the removal from the original post's retweets array
        if (post.retweetData) {
            const originalPost = await Post.findById(post.retweetData);
            if (originalPost) {
                // Remove the userId from the original post's retweets array
                originalPost.retweets = originalPost.retweets.filter(id => id.toString() !== userId);
                await originalPost.save();  // Save the changes to the original post
            }
        }

        // If the post contains an image, delete it from Cloudinary
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // Delete the post itself (whether it's an original post or a retweet)
        await Post.findByIdAndDelete(postId);

        // Optionally remove the post from the user's retweetedPosts array (if it's a retweet)
        if (post.retweetData) {
            await User.updateOne({ _id: userId }, { $pull: { retweetedPosts: postId } });
        }

        res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
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
            return res.status(404).json({ message: "Post not found" });
        }

        if (!text) {
            return res.status(400).json({ message: "Comment must have text" });
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
        res.status(500).json({ message: "Internal server error" });
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
            return res.status(404).json({ message: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);
        if (userLikedPost) {
            // Unlike logic
            post.likes = post.likes.filter(id => id.toString() !== userId);
            await post.save(); // Save post after removing the like

            // Remove the like from the user's likedPosts
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            // Optionally remove notification
            await Notification.findOneAndDelete({ from: userId, to: post.user._id, type: "like" });


        } else {
            // Like logic
            post.likes.push(userId);
            await post.save(); // Save post after adding the like

            // Add the post to the user's likedPosts
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

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
        res.status(500).json({ message: "Internal server error" });
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

export const retweetPost = async (req, res) => {
    try {
        const userId = req.user._id.toString(); // User A (retweeter)
        const postId = req.params.id; // The post being retweeted (User B's post)

        const post = await Post.findById(postId); // Find the post
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the post is already a retweet (i.e., has retweetData)
        if (post.retweetData) {
            return res.status(400).json({ errorType: "already_retweeted_post", message: "This post has already been retweeted!" });
        }

        // Check if User A has already retweeted this post
        const alreadyRetweeted = post.retweets.includes(userId);
        if (alreadyRetweeted) {
            return res.status(400).json({ errorType: "already_retweeted_by_user", message: "You have already retweeted this post" });
        }

        // Mark the post as retweeted by adding User A's ID to retweets
        post.retweets.push(userId);
        await post.save();

        // Add a reference to User B's post in User A's posts (My Posts section)
        const retweetReference = new Post({
            user: userId,
            retweetData: postId,
            text: post.text,
            img: post.img,
        });
        await retweetReference.save();

        res.status(201).json({ message: "Post retweeted successfully" });

    } catch (error) {
        console.log("Error in retweetPost controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const bookmarkPost = async (req, res) => {
    try {
        const userId = req.user._id.toString();  // Get the user ID from the authenticated user
        const postId = req.params.id;  // Get the post ID from the request params

        // Find the authenticated user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the post to be bookmarked
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the post is already bookmarked by the user
        const isBookmarked = user.bookmarks.includes(postId);

        if (isBookmarked) {
            // If already bookmarked, remove the post from bookmarks
            user.bookmarks = user.bookmarks.filter(id => id.toString() !== postId);
            await user.save();  // Save the updated user document
            res.status(200).json({ messageType: "Unbookmarked_by_user", message: "Post removed from bookmarks", post });
        } else {
            // If not bookmarked, add the post to bookmarks
            user.bookmarks.push(postId);
            await user.save();  // Save the updated user document
            res.status(200).json({ messageType: "bookmarked_by_user", message: "Post added to bookmarks", post });
        }

    } catch (error) {
        console.error("Error in bookmarkPost controller: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getBookmarkedPosts = async (req, res) => {
    try {
        const userId = req.user._id.toString();  // Get the authenticated user's ID

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all posts that are bookmarked by the user
        const bookmarkedPosts = await Post.find({ _id: { $in: user.bookmarks } })
            .populate({ path: "user", select: "-password" }) // Populate the post creator without the password field
            .populate({ path: "comments.user", select: "-password" }); // Populate comments with user data without the password

        if (bookmarkedPosts.length === 0) {
            return res.status(200).json({ message: "No bookmarked posts found" });
        }

        // Return the bookmarked posts
        res.status(200).json(bookmarkedPosts);

    } catch (error) {
        console.error("Error in getBookmarkedPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
