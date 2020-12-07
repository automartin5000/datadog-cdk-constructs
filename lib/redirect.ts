import { RuntimeType, runtimeLookup } from "./index";
import * as lambda from "@aws-cdk/aws-lambda";
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";

/**
 * To avoid modifying code in the user's lambda handler, redirect the handler to a Datadog
 * handler that initializes the Lambda Layers and then calls the original handler.
 * 'DD_LAMBDA_HANDLER' is set to the original handler in the lambda's environment for the
 * replacement handler to find.
 */

export function redirectHandlers(lambdas: lambda.Function[], addLayers: boolean) {
  lambdas.forEach((l) => {
    const cfnFunction = l.node.defaultChild as lambda.CfnFunction;
    const originalHandler = cfnFunction.handler;
    l.addEnvironment(DD_HANDLER_ENV_VAR, originalHandler);
    const handler = getDDHandler(l, addLayers);
    if (handler === undefined) {
      return;
    }
    cfnFunction.handler = handler;
  });
}

function getDDHandler(l: lambda.Function, addLayers: boolean) {
  let runtime: string = l.runtime.name;
  let lambdaRuntime: RuntimeType = runtimeLookup[runtime];
  if (lambdaRuntime === undefined || lambdaRuntime === RuntimeType.UNSUPPORTED) {
    return;
  }
  switch (lambdaRuntime) {
    case RuntimeType.NODE:
      return addLayers ? JS_HANDLER_WITH_LAYERS : JS_HANDLER;
    case RuntimeType.PYTHON:
      return PYTHON_HANDLER;
  }
}
