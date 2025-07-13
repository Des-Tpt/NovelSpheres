import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

interface PopupProps {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}

export function Popup({ message, type }: PopupProps) {
    const isSuccess = type === 'success';
    return (
        <div className='hidden md:flex'>
            <motion.div
                className={`popup ${isSuccess? 'popup-success' : 'popup-error'} hidden md:block fixed scale-100 bottom-5 right-5`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
            <div className= 'flex items-center gap-2'>
                <div className='popup-icon'>{isSuccess ? <CheckIcon className="w-7 h-7 text-green-500"/> : <ExclamationCircleIcon className="w-7 h-7 text-red-700"/>}</div>
                <div className='popup-content'>
                    <p className="title">{isSuccess ? 'Thao tác thành công' : 'Thao tác thất bại'}</p>
                    <p className="text">{message}</p>
                </div>
            </div>
            </motion.div>
        </div>
    );
}