import React, { useState } from "react";
import { Textarea, Text, Button } from "@chakra-ui/react";
import axios from "axios";

let proceed = false;
const DSLtab = () => {
  function validateDSL(input) {
    input = input.trim().toLowerCase();
    const words = input.split(" ");
    const parsedArgs = {};
    const knownKeywords = new Set([
      "file_name",
      "target_column",
      "model_type",
      "load_model",
      "save_model",
      "pca",
      "scaling",
      "min_max",
      "z_score",
      "one_hot",
      "label",
      "inputer",
    ]);

    let lastKeyword = null;

    // Process key-value pairs more robustly
    for (let i = 0; i < words.length; i++) {
      if (knownKeywords.has(words[i])) {
        lastKeyword = words[i];
        parsedArgs[lastKeyword] = null; // Initialize with null to handle missing values later
      } else if (lastKeyword && parsedArgs[lastKeyword] === null) {
        // Assign the first subsequent non-keyword as the value to the last found keyword
        parsedArgs[lastKeyword] = words[i];
      } else {
        // Handle unrecognized words that aren't directly after a keyword or are not keywords themselves
        parsedArgs[words[i]] = "unknown keyword";
      }
    }

    const required = {
      file_name: "string",
      target_column: "string",
      model_type: "number",
    };

    const optional = {
      load_model: "boolean",
      save_model: "boolean",
      pca: "boolean",
      scaling: "boolean",
      min_max: "boolean",
      z_score: "boolean",
      one_hot: "boolean",
      label: "boolean",
      inputer: "boolean",
    };

    let errors = [];

    // Check for unknown or incorrectly spelled arguments
    Object.keys(parsedArgs).forEach((key) => {
      if (!knownKeywords.has(key)) {
        errors.push(`Unknown or misspelled keyword: ${key}`);
      }
    });

    // Validate required and optional fields
    [...Object.keys(required), ...Object.keys(optional)].forEach((key) => {
      if (key in parsedArgs) {
        const value = parsedArgs[key];
        if (value === "unknown keyword") {
          errors.push(`No such keyword: ${key}`);
        } else if (value === null) {
          errors.push(`Value for ${key} is missing.`);
        } else {
          // Validate data types
          if (
            required[key] === "number" &&
            (isNaN(parseInt(value)) ||
              parseInt(value) < 0 ||
              parseInt(value) > 5)
          ) {
            errors.push(
              `Value for ${key} is not correct; expected a number between 0 and 5.`
            );
          } else if (required[key] === "string" && typeof value !== "string") {
            errors.push(`Value for ${key} is not correct; expected a string.`);
          } else if (
            optional[key] === "boolean" &&
            value !== "true" &&
            value !== "false"
          ) {
            errors.push(`Value for ${key} is not correct; expected a boolean.`);
          }
        }
      } else if (required[key]) {
        errors.push(`Missing required keyword: ${key}`);
      }
    });

    if (errors.length > 0) {
      setPredictions({ type: "error", result: errors.join("\n") });
      return;
    }

    proceed = true;
  }

  const [isLoading, setIsLoading] = React.useState(false);
  let [value, setValue] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [help, setHelp] = useState("");

  let handleInputChange = (e) => {
    let inputValue = e.target.value;
    setValue(inputValue);
  };
  function parseArgs(input) {
    const args = input.split(" "); // Split the input string into an array by spaces
    let output = "";

    const helpText = {
      file_name: "Specifies the name of the file to use for the model.",
      target_column: "Specifies the target column to predict.",
      model_type: `Specifies the type of algorithm to use for the model. Valid values are:
            0 - Linear Regression
            1 - Random Forest Regression
            2 - Support Vector Regression
            3 - Logistic Regression model
            4 - Forest Classifier model
            5 - Support Vector Classifier`,
      load_model: "If true, loads a model from the specified file.",
      model_name: "The name of the file where the model is saved.",
      save_model: "If true, saves the current model to a file.",
      pca: "If true, applies PCA to the model input.",
      scaling: "If true, applies scaling to the model input.",
      min_max: "If true, applies Min-Max normalization to the model input.",
      z_score: "If true, applies Z-score normalization to the model input.",
      one_hot: "If true, applies one-hot encoding to categorical variables.",
      label: "If true, applies label encoding to categorical variables.",
      inputer: "If true, handles missing values in the data.",
    };

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-h" && i > 0 && helpText[args[i - 1]]) {
        output += `${args[i - 1]}: ${helpText[args[i - 1]]}\n`;
      }
    }

    return output;
  }

  const handleSubmit = async () => {
    if (value.trim().endsWith("-h")) {
      const args = value.split(" ");
      const helpText = {
        file_name: "Specifies the name of the file to use for the model.",
        target_column: "Specifies the target column to predict.",
        model_type: `Specifies the type of algorithm to use for the model. Valid values are:
            0 - Linear Regression
            1 - Random Forest Regression
            2 - Support Vector Regression
            3 - Logistic Regression model
            4 - Forest Classifier model
            5 - Support Vector Classifier`,
        load_model: "If true, loads a model from the specified file.",
        save_model: "If true, saves the current model to a file.",
        pca: "If true, applies PCA to the model input.",
        scaling: "If true, applies scaling to the model input.",
        min_max: "If true, applies Min-Max normalization to the model input.",
        z_score: "If true, applies Z-score normalization to the model input.",
        one_hot: "If true, applies one-hot encoding to categorical variables.",
        label: "If true, applies label encoding to categorical variables.",
        inputer: "If true, handles missing values in the data.",
      };
      setHelp(helpText[args[args.length - 2]] || "No help flags found.");
    }
    if (value.trim().toLowerCase() == "help")
      setHelp(`
    ----------Necessary----------
    - file_name: Specifies the name of the file to use for the model.
    - target_column: Specifies the target column to predict.
    - model_type (number): Specifies the type of algorithm to use for the model. Valid values are 0 to 5.
    0 - Linear Regression
    1 - Random Forest Regression
    2 - Support Vector Regression
    3 - Logistic Regression model
    4 - Forest Classifier model
    5 - Support Vector Classifier 
    ----------Optional----------
    - load_model (boolean): If true, loads a model from the specified file.
    - model_name (string): The name of the file where the model is saved.
    - save_model (boolean): If true, saves the current model to a file.
    - pca (boolean): If true, applies PCA to the model input.
    - scaling (boolean): If true, applies scaling to the model input.
    - min_max (boolean): If true, applies Min-Max normalization to the model input.
    - z_score (boolean): If true, applies Z-score normalization to the model input.
    - one_hot (boolean): If true, applies one-hot encoding to categorical variables.
    - label (boolean): If true, applies label encoding to categorical variables.
    - inputer (boolean): If true, handles missing values in the data.`);

    validateDSL(value);

    if (proceed) {
      setPredictions({});
      setHelp("");
      const words = value.split(" ");
      const params = {};
      for (let i = 0; i < words.length; i += 2) {
        if (i + 1 < words.length) {
          params[words[i]] = words[i + 1];
        }
      }
      setIsLoading(true);
      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (data.type == "result") {
        setPredictions({
          ...data,
          init: data.init.slice(0, 500),
          predicted: data.predicted.slice(0, 500),
        });
      } else setPredictions(data);
      console.log(data); // Handling the response from the backend
      setIsLoading(false);
      proceed = false;
    }
  };
  const roundToHundredths = (value) => {
    return Math.round(value * 100) / 100; // Multiply by 100, round it, then divide by 100
  };
  return (
    <>
      {/* <Text mb="8px">
        select `filename` target `target_column` algorithm ``
      </Text> */}
      <Textarea
        value={value}
        onChange={handleInputChange}
        placeholder="Here is a sample placeholder"
        size="sm"
      />
      <Button
        className="mt-4"
        colorScheme="blue"
        onClick={() => handleSubmit()}
      >
        Predict
      </Button>
      {isLoading && (
        <p className="text-blue-500 mt-4 text-center text-2xl">Loading...</p>
      )}
      {predictions?.type == "result" && (
        <div className="mt-8 text-center flex flex-col items-center">
          <h3 className="text-xl font-semibold">
            Error Type - {predictions.error_type}
          </h3>
          <p className="text-red-400">{predictions.error}</p>
          <table className="table-auto border-collapse border border-green-800 mt-4">
            <thead>
              <tr>
                <th className="border border-green-600 px-4 py-2">Test</th>
                <th className="border border-green-600 px-4 py-2 text-center">
                  Prediction
                </th>
              </tr>
            </thead>
            <tbody>
              {predictions.predicted.map((pred, index) => (
                <tr key={index}>
                  <td className="border border-green-500 px-4 py-2">
                    {roundToHundredths(predictions.init[index])}
                  </td>
                  <td className="border border-green-500 px-4 py-2">
                    {roundToHundredths(predictions.predicted[index])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {predictions?.type == "error" && (
        <p className="text-red-500 mt-4 text-center">{predictions.result}</p>
      )}
      {help != "" && <pre className="text-blue-500 mt-4">{help}</pre>}
    </>
  );
};

export default DSLtab;
