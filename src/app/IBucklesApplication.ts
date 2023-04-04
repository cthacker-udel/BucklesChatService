export interface IBucklesApplication {
    /**
     * Starts the application, and enables it to listen on a port
     *
     * @returns Nothing, as it starts the application using an internal method of the local `app` member
     */
    start: () => void;
}
