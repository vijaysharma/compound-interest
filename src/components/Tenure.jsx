const Tenure = ({ rt, setRt }) => {
  const setTenure = (n) => {
    let tenure = rt.tenure;
    tenure += parseInt(n);
    if (tenure <= 0) {
      setRt({ ...rt, tenure: 0 });
      return;
    }
    setRt({ ...rt, tenure: tenure });
  };
  return (
    <div className="mt-4 mb-4 text-center">
      <h5>Tenure </h5>
      <div className="join focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        <button
          className="join-item btn border-primary"
          onClick={() => setTenure(-10)}
        >
          -10
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setTenure(-1)}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          className="input input-bordered input-primary focus:outline-none join-item w-24 text-center"
          value={rt.tenure}
          onChange={(e) => setRt({ ...rt, tenure: Math.abs(e.target.value) })}
        />
        <button
          className="join-item btn border-primary"
          onClick={() => setTenure(+1)}
        >
          +1
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setTenure(+10)}
        >
          +10
        </button>
      </div>
      <div className="join ml-4">
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="tenure"
          aria-label="M"
          value={"m"}
          checked={rt.tenureFormat === "m"}
          onChange={(e) => setRt({ ...rt, tenureFormat: e.target.value })}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="tenure"
          aria-label="Y"
          value={"y"}
          checked={rt.tenureFormat === "y"}
          onChange={(e) => setRt({ ...rt, tenureFormat: e.target.value })}
        />
      </div>
    </div>
  );
};

export default Tenure;
