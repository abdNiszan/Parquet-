const CheckButton = ({ gridRef, onCheck }) => {
  return (
    <button
      onClick={() => {
        console.log("Grid in CheckButton:", gridRef.current); 
        onCheck(false, gridRef.current);
      }}
    >
      Check answer
    </button>
  );
};

export default CheckButton;