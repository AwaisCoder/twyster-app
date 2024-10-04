import React from 'react';
import Posts from '../../components/common/Posts';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

const Bookmark = ({ userId }) => {
    const hasBookmarks = true;
    return (
        <div className='flex-[4_4_0] border-r border-gray-700 min-h-screen'>
            {/* Header */}
            <div className='flex justify-between items-center p-4 border-gray-700'>
                <p className='font-bold text-2xl'>Bookmarks</p>
            </div>

            {/* Bookmarks Section */}
            <div className="border border-gray-700 p-4 sm:p-6 shadow-md mt-4">
                {hasBookmarks ? (
                    <Posts feedType="bookmarks" userId={userId} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <FaRegBookmark className="w-12 h-12 text-gray-500 mb-4" />
                        <p className="text-lg text-gray-400">No bookmarks yet. Start saving your favorite posts!</p>
                    </div>
                )}
            </div>
        </div>
    );

};

export default Bookmark;
