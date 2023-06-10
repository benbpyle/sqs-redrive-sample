import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";

import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IQueue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class ProcessorFunc extends Construct {
    private readonly _func: GoFunction;

    get func(): IFunction {
        return this._func;
    }

    constructor(scope: Construct, id: string, queue: IQueue) {
        super(scope, id);

        this._func = new GoFunction(scope, `ProcessorFunc`, {
            entry: "src/processor",
            functionName: "processor",
            timeout: Duration.seconds(30),
            environment: {
                IS_LOCAL: "false",
                LOG_LEVEL: "debug",
                FAIL: "true",
            },
        });

        this._func.addEventSource(
            new SqsEventSource(queue, {
                batchSize: 10,
                enabled: true,
            })
        );

        queue.grantConsumeMessages(this._func);
    }
}
