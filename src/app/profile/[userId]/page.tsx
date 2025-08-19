import ProfilePage from "@/components/profile/ProfilePage";

const Profile = async (context: { params: Promise<{ userId: string }> }) => {
    const { userId: userId } = await context.params;
    return (
        <>
            <title>Hồ sơ</title>
            <div className="min-h-screen bg-gray-950 md:px-[15%]">
                <ProfilePage userId={userId} />
            </div>
        </>
    )
}

export default Profile;