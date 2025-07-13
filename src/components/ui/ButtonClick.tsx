import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import './Button.css';
import { motion } from "framer-motion";

interface ButtonProps {
    type: ReactNode | null;
    text: string;
    href: string;
    onClick?: () => void;
}

const ButtonClick = ({ type, text, href, onClick }: ButtonProps) => {
    const router = useRouter();
    
    const buttonVariants = {
        initial: { opacity: 1, scale: 1 },
        hover: { scale: 1.1, transition: { duration: 0.2 } },
        tap: { scale: 0.95, transition: { duration: 0.01 } },
    };

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        router.push(href);
    };

    return (
        <motion.button
            className={`button`}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.1, ease: "easeInOut" }}
            onClick={handleClick}
        >
            {type}
            <span className="text-span">{text}</span>
        </motion.button>
    )
}

export default ButtonClick;