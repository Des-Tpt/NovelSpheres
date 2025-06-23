import { ReactNode } from "react";
import Link from "next/link";
import './Button.css';
import { motion } from "framer-motion";

interface ButtonProps {
    type: ReactNode | null;
    text: string;
    href: string;
    onClick?: () => void;
}

const Button = ({ type, text, href, onClick }: ButtonProps) => {
    
    const buttonVariants = {
        initial: { opacity: 1, scale: 1 },
        hover: { scale: 1.1, transition: { duration: 0.2 } },
        tap: { scale: 0.95, transition: { duration: 0.01 } },
    };

    return (
        <Link className="link" href={href} onClick = {onClick}>
            <motion.button
                className={`button`}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                transition={{ duration: 0.1 , ease: "easeInOut" }}>
                    {type}
                    <span className="text-span">{text}</span>
            </motion.button>
        </Link>
    )
}

export default Button;