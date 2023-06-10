import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StartRedriveFunc } from "./functions/start-redrive";
import { CheckRedriveStatusFunc } from "./functions/check-redrive-status";
import { WorkflowStateMachine } from "./step-functions/workflow";
import Queues from "./queues/queue";
import { ProcessorFunc } from "./functions/processor";

export class MainStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const queues = new Queues(this, "Queues");
        const processor = new ProcessorFunc(this, "Processor", queues.queue);
        const redrive = new StartRedriveFunc(
            this,
            "StartRedrive",
            queues.queue,
            queues.dlq
        );
        const status = new CheckRedriveStatusFunc(
            this,
            "CheckRedriveStatus",
            queues.dlq
        );
        const stateMachine = new WorkflowStateMachine(
            this,
            "SqsRedriveWorkflow",
            {
                checkStatusFunc: status.func,
                startRedriveFunc: redrive.func,
            }
        );
    }
}
