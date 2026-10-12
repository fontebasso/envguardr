export type VariableType = "string" | "number" | "boolean" | "url" | "enum";

type BaseVariable = {
  name: string;
  required: boolean;
  default?: string;
  message?: string;
};

export type StringVariable = BaseVariable & {
  type: "string";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  format?: "json" | "date";
};

export type NumberVariable = BaseVariable & {
  type: "number";
  min?: number;
  max?: number;
};

export type BooleanVariable = BaseVariable & { type: "boolean" };

export type UrlVariable = BaseVariable & { type: "url" };

export type EnumVariable = BaseVariable & {
  type: "enum";
  values: string[];
};

export type Variable =
  | StringVariable
  | NumberVariable
  | BooleanVariable
  | UrlVariable
  | EnumVariable;

export type Schema = {
  version: 1;
  variables: Variable[];
};
