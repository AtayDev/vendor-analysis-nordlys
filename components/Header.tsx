import React from 'react';
import { ChipIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 bg-gray-900/70 backdrop-blur-sm border-b border-gray-700/50 p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <ChipIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="text-xl font-bold tracking-wider text-gray-100">
          Vendor Data Unification System
        </h1>
      </div>
      <div className="flex items-center gap-2">
         <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
         <span className="text-sm text-green-400 font-medium">System Online</span>
      </div>
    </header>
  );
};

export default Header;