/* eslint-disable no-unused-vars -- disabled */

enum ActiveStatusType {
    OFFLINE = 0,
    AWAY = 1,
    ONLINE = 2,
}

type ActiveStatus = {
    status: ActiveStatusType;
    timeLeft: number;
};

export { ActiveStatusType, type ActiveStatus };
