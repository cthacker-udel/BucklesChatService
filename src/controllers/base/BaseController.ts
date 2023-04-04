export class BaseController {
    public table: string;

    public constructor(_tableName?: string) {
        this.table = _tableName ?? "";
    }
}
