import * as env from "dotenv";
import { BucklesApplication } from "./app/BucklesApplication";

env.config();
new BucklesApplication().start();
