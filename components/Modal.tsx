import React from 'react';

interface ModalProps {
    title: string;
    message: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex z-50 items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-[--color-error] mb-2">{title}</h3>
                <p className="text-sm text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition duration-150 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
