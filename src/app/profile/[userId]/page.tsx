import ProfilePage from "@/components/profile/ProfilePage";

const Profile = async (context: { params: Promise<{ userId: string }> }) => {
    const { userId: userId } = await context.params;
    return <ProfilePage userId={userId} />
}

export default Profile;