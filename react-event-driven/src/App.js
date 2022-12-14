import "bootstrap/dist/css/bootstrap.css";
import { useState } from "react";
import Delivery from "./Delivery";

function App() {
  const [id, setId] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    const response = await fetch(
      `${process.env.REACT_APP_URL}/delivery/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREATE_DELIVERY",
          data,
        }),
      }
    );
    const { deliveryId } = await response.json();
    console.log(id);
    setId(deliveryId);
  };
  return (
    <div className="App">
      <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
        {id === "" ? (
          <div className="card">
            <div className="card-header">Create Delivery</div>
            <form className="card-body" onSubmit={submit}>
              <div className="mb-3">
                <input
                  type="number"
                  name="budget"
                  className="form-control"
                  placeholder="Budget"
                ></input>
              </div>
              <div className="mb-3">
                <textarea
                  name="notes"
                  className="form-control"
                  placeholder="Notes"
                />
              </div>
              <button className="btn btn-primary">Submit</button>
            </form>
          </div>
        ) : (
          <Delivery id={id} />
        )}
      </div>
    </div>
  );
}

export default App;
