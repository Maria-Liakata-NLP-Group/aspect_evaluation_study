import { useState } from "react";

const ExplanationInput = ({maxTextLength, submitTextInput}) => {
    const [textInput, setTextInput] = useState("");

    const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
    };

    const handleTextInputBlur = () => {
        submitTextInput(textInput);
    }

    return (
      <div className="field mt-2 mb-5">
        <label className="label">
          Please give a short explanation for your decision.
        </label>
        <div className="control">
          <textarea
            className="textarea"
            type="text"
            rows="6"
            placeholder={"Type here..."}
            value={textInput}
            maxLength={maxTextLength}
            onChange={handleTextInputChange}
            onBlur={handleTextInputBlur}
          ></textarea>
          <div className="has-text-right">
            {maxTextLength - textInput.length} characters remaining
          </div>
        </div>
      </div>
    );
}

export default ExplanationInput;