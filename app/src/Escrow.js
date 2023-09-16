export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
}) {
  console.log("aaaaaaaaa: ", handleApprove);
  return (
    <div className="existing-contract">
      <div className="fields flex ">
        <div
          className="py-3 truncate px-2 min-w-[200px] cursor-pointer"
          title={arbiter}
          onClick={() => {
            navigator.clipboard.writeText(arbiter);
            alert("copied to clipboard");
          }}
        >
          {arbiter}
        </div>
        <div
          className="py-3 truncate px-2 min-w-[200px] cursor-pointer"
          title={beneficiary}
        >
          {beneficiary}
        </div>
        <div
          className="py-3 truncate px-2 min-w-[200px] cursor-pointer"
          title={value}
        >
          {value}
        </div>
        <div className="py-3 truncate px-2 min-w-[200px] cursor-pointer">
          <button
            className="w-full px-6 py-2 bg-gradient-to-r from-blue-300 to-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg"
            // id={account ?? undefined}
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
