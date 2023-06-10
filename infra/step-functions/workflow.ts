import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import * as stepfunctions from "aws-cdk-lib/aws-stepfunctions";
import {
    Choice,
    Condition,
    IChainable,
    IStateMachine,
    LogLevel,
    Succeed,
} from "aws-cdk-lib/aws-stepfunctions";
import * as logs from "aws-cdk-lib/aws-logs";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { IFunction } from "aws-cdk-lib/aws-lambda";

interface WorkflowProps {
    startRedriveFunc: IFunction;
    checkStatusFunc: IFunction;
}

export class WorkflowStateMachine extends Construct {
    private _stateMachine: sf.StateMachine;

    get stateMachine(): IStateMachine {
        return this._stateMachine;
    }

    constructor(scope: Construct, id: string, props: WorkflowProps) {
        super(scope, id);
        this.finalizeStateMachine(scope, props);
    }

    finalizeStateMachine = (scope: Construct, props: WorkflowProps) => {
        const logGroup = new logs.LogGroup(this, "CloudwatchLogs", {
            logGroupName: "/aws/vendedlogs/states/workflow",
        });

        const flow = this.buildStateMachine(scope, props);

        this._stateMachine = new stepfunctions.StateMachine(
            this,
            "StateMachine",
            {
                // role: role,
                stateMachineName: "SqsRedriveWorkflow",
                definition: flow,
                stateMachineType: stepfunctions.StateMachineType.EXPRESS,
                timeout: Duration.minutes(5),
                logs: {
                    level: LogLevel.ALL,
                    destination: logGroup,
                    includeExecutionData: true,
                },
            }
        );
    };

    buildStateMachine = (
        scope: Construct,
        props: WorkflowProps
    ): stepfunctions.IChainable => {
        const success = new Succeed(scope, "Redrive Complete");
        const unknownSuccess = new Succeed(scope, "No Redrives in Process");
        const failure = new sf.Fail(scope, "Redrive Failed");
        const wait = this.buildWaitTask(scope, Duration.seconds(3));
        const startRedriveTask = this.buildStartRedrive(props.startRedriveFunc);
        const checkRedriveStatusTask = this.buildCheckRedriveStatus(
            props.checkStatusFunc
        );

        return startRedriveTask
            .next(wait)
            .next(checkRedriveStatusTask)
            .next(
                this.buildStatusChoice(
                    scope,
                    wait,
                    success,
                    unknownSuccess,
                    failure
                )
            );
    };

    buildWaitTask = (scope: Construct, duration: Duration): sf.Wait => {
        return new sf.Wait(scope, "Wait for Redrive", {
            time: sf.WaitTime.duration(duration),
        });
    };

    buildStartRedrive = (func: IFunction): LambdaInvoke => {
        const liFun = new LambdaInvoke(this, "Start Redrive", {
            comment: "Begins the DLQ Redrive",
            outputPath: "$.Payload",
            lambdaFunction: func,
        });

        return liFun;
    };

    buildCheckRedriveStatus = (func: IFunction): LambdaInvoke => {
        const liFun = new LambdaInvoke(this, "Check Redrive Status", {
            comment: "Checks the Redrive Status",
            outputPath: "$.Payload",
            lambdaFunction: func,
        });

        return liFun;
    };

    buildStatusChoice = (
        scope: Construct,
        wait: IChainable,
        success: IChainable,
        unknownSuccess: IChainable,
        failed: IChainable
    ): IChainable => {
        return new Choice(scope, "Redrive Status", {
            comment:
                "Decide if the redrive status is good, on-going or unknown",
        })
            .when(Condition.stringEquals("$.status", "COMPLETED"), success)
            .when(Condition.stringEquals("$.status", "UNKNOWN"), unknownSuccess)
            .when(Condition.stringEquals("$.status", "RUNNING"), wait)
            .otherwise(failed);
    };
}
