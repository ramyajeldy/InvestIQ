function QuestionChips({ questions, onSelect }) {
  return (
    <div className="question-chip-row">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          className="question-chip"
          onClick={() => onSelect(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}

export default QuestionChips;
