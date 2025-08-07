import { useRouter } from "next/navigation";

const handleToProfile = (_id: string) => {
    const router = useRouter();
    router.push(`/profile/${_id}`);
}

export default handleToProfile;