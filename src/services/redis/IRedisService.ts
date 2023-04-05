export interface IRedisService {
    /**
     * Fires the connection request to the Redis database
     */
    init: () => void;
}
