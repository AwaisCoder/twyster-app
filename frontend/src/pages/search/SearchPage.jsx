import { useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { AiOutlineSearch } from "react-icons/ai";

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [query, setQuery] = useState("");

    const { data: searchResults, isLoading, isError } = useQuery({
        queryKey: ["searchResults", searchTerm],
        queryFn: async () => {
            if (!searchTerm) return [];
            try {
                const res = await fetch(`/api/users/search?query=${searchTerm}`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                toast.error(error.message);
                throw new Error(error);
            }
        },
        enabled: !!searchTerm, // Only fetch when query is not empty
    });

    const handleSearch = () => { };

    return (
        <div className='flex-1 border-l border-r border-gray-700 min-h-screen p-4'>
            <div className='mb-6'>
                <div className='font-bold mb-2 text-gray-100'>Search</div>
                <div className='form-control'>
                    <div className='input-group flex items-center'>
                        <input
                            type='text'
                            placeholder="Who are you looking for?"
                            className='input input-bordered w-full rounded-l-md border-gray-500 focus:border-gray-700 focus:ring-0'
                            aria-label='Search users'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                }
                            }}
                        />
                        <button
                            className='btn btn-square rounded-r-md bg-gray-700'
                            onClick={() => setSearchTerm(searchTerm)}
                        >
                            <AiOutlineSearch className='w-6 h-6 text-gray-100' />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className='flex justify-center items-center h-full'>
                    <LoadingSpinner size='lg' />
                </div>
            )}

            {isError && (
                <div className='text-center p-4 font-bold text-red-500'>
                    Something went wrong 😔
                </div>
            )}

            {searchResults?.length === 0 && !isLoading && !isError && (
                <div className='text-center p-4 font-bold text-gray-300'>
                    No results found 🤔
                </div>
            )}

            {searchResults?.map((user) => (
                <div className='border-b border-gray-700 py-3' key={user._id}>
                    <Link to={`/profile/${user.username}`} className='flex items-center gap-3 hover:bg-gray-800 p-3 rounded-md transition'>
                        <div className='avatar'>
                            <div className='w-14 h-14 rounded-full overflow-hidden'>
                                <img
                                    src={user.profileImg || "/avatar-placeholder.png"}
                                    alt={`Profile of ${user.username}`}
                                    className='object-cover w-full h-full'
                                />
                            </div>
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-lg font-semibold text-gray-100'>@{user.username}</span>
                            <span className='text-gray-400'>{user.fullName}</span>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default SearchPage;
