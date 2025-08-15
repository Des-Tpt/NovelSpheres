import Pusher from "pusher-js";

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/auth/pusher",
});

export function createPusherWithSession() {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        disableStats: true,
        authEndpoint: "/api/auth/pusher",

        authorizer: (channel, options) => {
            return {
                authorize: (socketId: string, callback: (err: any, auth?: any) => void) => {
                    fetch(options.authEndpoint!, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channel.name,
                        }),
                    })
                        .then(async (res) => {
                            if (!res.ok) {
                                const text = await res.text().catch(() => "");
                                throw new Error(`Auth failed: ${res.status} ${text}`);
                            }
                            return res.json();
                        })
                        .then((data) => callback(null, data))
                        .catch((err) => callback(err, null));
                },
            };
        },
    });

    return pusher;
}
