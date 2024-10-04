import React, { useState, useEffect } from 'react';
import { BsFillMoonStarsFill, BsFillSunFill } from 'react-icons/bs'; // Icons for theme switching

const ThemeSwitcher = () => {
    // Available DaisyUI themes
    const themes = ['black', 'valentine', 'coffee', 'sunset'];
    const [theme, setTheme] = useState('black'); // Default theme

    useEffect(() => {
        // Apply the selected theme to the document using data-theme attribute
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme); // Update the selected theme
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-bold mb-4">Set the mood</h3>
            <div className="grid grid-cols-2 gap-4"> {/* Changed to 2 columns */}
                {themes.map((themeName) => (
                    <button
                        key={themeName}
                        onClick={() => handleThemeChange(themeName)}
                        className={`btn btn-outline btn-xs ${theme === themeName ? 'btn-active' : ''}`} // Changed to btn-xs for smaller buttons
                    >
                        {themeName === 'black' || themeName === 'cyberpunk' ? (
                            <BsFillMoonStarsFill className="text-lg" /> // Adjusted icon size
                        ) : (
                            <BsFillSunFill className="text-lg" /> // Adjusted icon size
                        )}
                        <span className="ml-1 capitalize">{themeName}</span> {/* Display theme name */}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSwitcher;
