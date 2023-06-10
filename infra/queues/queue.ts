import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export default class Queues extends Construct {
    private readonly _queue: IQueue;
    private readonly _dlqQueue: IQueue;

    get queue(): IQueue {
        return this._queue;
    }

    get dlq(): IQueue {
        return this._dlqQueue;
    }

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this._dlqQueue = new Queue(scope, "SampleDlq", {
            queueName: "sample-dlq",
        });

        this._queue = new Queue(scope, `SampleQueue`, {
            queueName: "sample",
            deadLetterQueue: {
                maxReceiveCount: 1,
                queue: this._dlqQueue,
            },
        });
    }
}
