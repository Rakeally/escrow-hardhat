import server from "./server";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";
const contractABI = require("./artifacts/contracts/Escrow.sol/Escrow.json");

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState();
  const [formData, setFormData] = useState({
    arbiter: "",
    beneficiary: "",
    eth: 0,
  });
  const [error, setError] = useState(null);
  const [approveError, setApproveError] = useState(null);
  const [contractAddress, setContractAddress] = useState();

  useEffect(() => {
    let storedEscrow;
    async function fetchData() {
      try {
        storedEscrow = await server.get(`all-escrows`);

        if (storedEscrow.data.length) {
          setEscrows(storedEscrow.data);
        }
      } catch (err) {
        console.log("error occured: ", err);
      }
    }
    fetchData();
  }, []);

  async function connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const accounts = await provider.send("eth_requestAccounts", []);

    const currentSigner = provider.getSigner();
    const bal = await currentSigner.getBalance();

    setBalance(ethers.utils.formatEther(bal));

    setAccount(accounts[0]);
    setSigner(currentSigner);
  }

  useEffect(() => {
    setError(null);
  }, [formData]);

  async function newContract() {
    const { arbiter, beneficiary, eth } = formData;
    if (!eth || Number(eth) < 1) {
      setError("Must enter a valid amount");
      return;
    }
    const value = ethers.utils.parseUnits(eth, 18).toString();

    if (!arbiter) {
      setError("Must enter an arbiter");
      return;
    }
    if (!beneficiary) {
      setError("Must enter a beneficiary");
      return;
    }

    if (Number(eth) > Number(balance)) {
      setError("Insufficient balance");
      return;
    }
    try {
      setLoading(true);
      const escrowContract = await deploy(signer, arbiter, beneficiary, value);

      const escrow = {
        address: escrowContract.address,
        arbiter,
        beneficiary,
        value: eth.toString(),
        approved: false,
      };

      await server.post(`create-escrow`, escrow);

      setEscrows([...escrows, escrow]);

      setLoading(false);

      setBalance((prev) => prev - escrow.value);
    } catch (error) {
      setLoading(false);
      setError("Transaction rejected");
    }
  }

  const handleApprove = async (escrow) => {
    try {
      setContractAddress(escrow.address);
      setLoading(true);
      const otherEscrow = escrows.filter(
        (item) => item.address !== escrow.address
      );
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentSigner = provider.getSigner();
      try {
        const contract = new ethers.Contract(
          escrow.address,
          contractABI.abi,
          currentSigner
        );

        await contract.approve();

        const updatedEscrow = await server.put(
          `update-escrow/${escrow.address}`,
          { approved: true }
        );
        const approvedEscrow = {
          address: updatedEscrow.data.address,
          arbiter: updatedEscrow.data.arbiter,
          beneficiary: updatedEscrow.data.beneficiary,
          value: updatedEscrow.data.value,
          approved: updatedEscrow.data.approved,
        };

        setEscrows([...otherEscrow, approvedEscrow]);
        setLoading(false);
        setContractAddress();
      } catch (error) {
        setLoading(false);
        setContractAddress();
        setApproveError("Error occurred during approval");
      }
    } catch (error) {
      setLoading(false);
      setContractAddress();
      setApproveError("Error occurred during approval");
    }
  };

  return (
    <div
      className={
        !account
          ? "h-[100vh] flex flex-col items-center justify-center w-full bg-gray-100"
          : "bg-gray-100"
      }
    >
      {!account ? (
        <div className="block p-6 rounded-lg shadow-lg bg-white mx-auto my-4 w-[400px]">
          <button
            className="w-full px-6 py-2 bg-gradient-to-r from-blue-300 to-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg"
            id="deploy"
            onClick={connectWallet}
          >
            Connect your wallet
          </button>
        </div>
      ) : (
        <div className="flex justify-around mx-20 mr-5">
          <div class="min-h-screen  py-6 flex flex-col justify-center sm:py-12">
            <div class="relative py-3 sm:max-w-xl sm:mx-auto">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
              <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                <div class="max-w-md mx-auto">
                  <div>
                    <h1 class="text-2xl font-semibold">
                      Alchemy Escrow dApp by Jane K.
                    </h1>
                  </div>
                  <div class="divide-y divide-gray-200">
                    <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                      <div class="relative">
                        <input
                          autocomplete="off"
                          type="text"
                          class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                          id="my_account"
                          disabled
                          value={account}
                        />
                        <label
                          for="my_account"
                          class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                        >
                          My Address
                        </label>
                      </div>
                      <br />
                      <div class="relative">
                        <input
                          autocomplete="off"
                          type="text"
                          class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                          id="my_balance"
                          disabled
                          value={balance}
                        />
                        <label
                          for="my_balance"
                          class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                        >
                          My Balance
                        </label>
                      </div>
                      <br />

                      <div class="relative mt-30">
                        <input
                          autocomplete="off"
                          id="arbiter"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              arbiter: e.target.value,
                            }))
                          }
                          name="arbiter"
                          type="text"
                          class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                          placeholder="Arbiter account"
                        />
                        <label
                          for="arbiter"
                          class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-blue-600 peer-focus:text-sm"
                        >
                          Arbiter account
                        </label>
                      </div>
                      <br />
                      <div class="relative">
                        <input
                          autocomplete="off"
                          id="beneficiary"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              beneficiary: e.target.value,
                            }))
                          }
                          name="beneficiary"
                          type="text"
                          class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                          placeholder="beneficiary account"
                        />
                        <label
                          for="beneficiary"
                          class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-blue-600 peer-focus:text-sm"
                        >
                          Beneficiary account
                        </label>
                      </div>
                      <br />
                      <div class="relative">
                        <input
                          autocomplete="off"
                          id="eth"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              eth: e.target.value,
                            }))
                          }
                          name="eth"
                          type="number"
                          step="0.01"
                          class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                          placeholder="eth"
                        />
                        <label
                          for="eth"
                          class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-blue-600 peer-focus:text-sm"
                        >
                          Deposit Amount (in ETH)
                        </label>
                      </div>

                      <div class="relative">
                        <button
                          className="w-full px-6 py-2 bg-gradient-to-r from-blue-300 to-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg"
                          id="deploy"
                          onClick={(e) => {
                            if (!loading) {
                              e.preventDefault();

                              newContract();
                            }
                          }}
                        >
                          {!contractAddress && loading ? (
                            <svg
                              aria-hidden="true"
                              class="inline w-6 h-6 mr-2 text-gray-200 animate-spin fill-blue-600"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                          ) : (
                            " Deploy contract"
                          )}
                        </button>
                      </div>
                      {error ? (
                        <p
                          style={{
                            color: "red",
                            textAlign: "center",
                          }}
                        >
                          {error}
                        </p>
                      ) : undefined}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`w-[55%] h-[100vh] flex flex-col items-center justify-center ml-5`}
          >
            <div
              className={
                escrows.length
                  ? "border-2 rounded min-h-[50vh] w-full"
                  : undefined
              }
            >
              {escrows.length > 0 && (
                <div className="block p-6 mx-auto my-4 w-full">
                  <h1 className="text-center font-bold text-xl mb-4">
                    Your Existing Contracts
                  </h1>

                  {/* <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-4"> */}
                  <div class="relative overflow-x-auto">
                    <div className="flex border-2 rounded justify-between">
                      <div class="px-2 py-3 min-w-[220px]">Arbiter</div>
                      <div class="px-2 py-3 min-w-[220px]">Beneficiary</div>
                      <div class="px-2 py-3 min-w-[90px]">Value (Eth)</div>
                      <div class="px-2 py-3 min-w-[100px]">Action</div>
                    </div>
                    <div>
                      {escrows.map((escrow) => {
                        return (
                          <Escrow
                            key={escrow.address}
                            {...escrow}
                            loading={
                              loading && escrow.address === contractAddress
                            }
                            handleApprove={() => handleApprove(escrow)}
                          />
                        );
                      })}
                      {approveError ? (
                        <p
                          style={{
                            color: "red",
                            textAlign: "center",
                          }}
                          className="mt-10"
                        >
                          {approveError}
                        </p>
                      ) : undefined}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!escrows.length ? (
              <div className=" font-bold border-2 rounded h-[50vh] w-full m-10 flex flex-col items-center justify-center">
                No transaction found
              </div>
            ) : undefined}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
