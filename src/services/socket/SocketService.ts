import { Server as SocketServer } from "socket.io";
import { Server } from "http";

/**
 * The service handling instantiation of the websocket server
 */
export class SocketService {
    /**
     * The websocket server instance
     */
    public server: SocketServer;

    /**
     * 1-arg constructor which instantiates the websocket server
     *
     * @param server - The http server constructed in the base application
     */
    constructor(server: Server) {
        this.server = new SocketServer(server, {
            cors: {
                methods: ["GET"],
                origin: process.env.WEBSOCKET_ORIGIN,
            },
        });
        this.server.on("connection", () => {
            console.log("a person connected");
        });
    }
}
