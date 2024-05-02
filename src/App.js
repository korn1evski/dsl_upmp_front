import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setColumns(response.data.columns);
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedColumns([...selectedColumns, value]);
    } else {
      setSelectedColumns(selectedColumns.filter((column) => column !== value));
    }
  };

  const handleSubmit = async () => {
    if (!file || selectedColumns.length === 0) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result
        .replace("data:", "")
        .replace(/^.+,/, "");
      try {
        setIsLoading(true);
        const response = await axios.post("http://127.0.0.1:5000/predict", {
          selectedColumns: selectedColumns,
        });
        console.log(response.data);
        setPredictions(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error making predictions:", error);
        setIsLoading(false);
      }
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "long" }); // gets the full name of the month
    const year = date.getFullYear(); // gets the full year
    return `${month} ${year}`;
  };

  const roundToHundredths = (value) => {
    return Math.round(value * 100) / 100; // Multiply by 100, round it, then divide by 100
  };

  return (
    <div className="App bg-gray-100 min-h-screen flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Sales Predictor</h1>
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="form-input px-4 py-2 border rounded"
        />
        <button
          onClick={handleUpload}
          className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Upload File
        </button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">
          Select Columns for Prediction:
        </h2>
        {columns.map((column) => (
          <label key={column} className="inline-flex items-center mt-3">
            <input
              type="checkbox"
              value={column}
              onChange={handleCheckboxChange}
              checked={selectedColumns.includes(column)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="mx-2 text-gray-700">{column}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Predict Sales
      </button>
      {predictions && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold">Predictions</h3>
          <table className="table-auto border-collapse border border-green-800 mt-4">
            <thead>
              <tr>
                <th className="border border-green-600 px-4 py-2">Date</th>
                <th className="border border-green-600 px-4 py-2">
                  Prediction
                </th>
              </tr>
            </thead>
            <tbody>
              {predictions.predictions.map((pred, index) => (
                <tr key={index}>
                  <td className="border border-green-500 px-4 py-2">
                    {formatDate(predictions.dates[index])}
                  </td>
                  <td className="border border-green-500 px-4 py-2">
                    {roundToHundredths(predictions.predictions[index])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
