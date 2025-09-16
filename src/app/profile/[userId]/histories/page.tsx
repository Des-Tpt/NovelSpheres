import Histories from "@/components/histories/History";

const historyPage = async (context: { params: Promise<{ userId: string }> }) => {
    const { userId } = await context.params;
    return <Histories userId={userId} />
}

export default historyPage;