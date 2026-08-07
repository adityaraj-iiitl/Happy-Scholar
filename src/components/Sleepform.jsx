import React from "react";
import "./Sleepform.css"
import {Link} from "react-router-dom"
function Sleepform() {
  return (
    <>
      <div className="container mt-4">
        {/* The g-4 class will now perfectly add space between the columns */}
        <div className="row g-4">
          
          {/* Card 1 Wrapper */}
          <div className="col-12 col-md-4">
            <div className="card h-85">
              <img src="../src/assets/SleepForm.png" className="card-img-top img-fluid" alt="Sleep Metrics Graphic" />
              <div className="card-body">
                <h5 className="card-title">Fill Sleep Form</h5>
                <p className="card-text">
                 Fill out the details in today's sleep form and generate the updated recommendations and history
                </p>
                <Link to="/Sleepform" className="btn btn-primary">
                SleepForm
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 Wrapper */}
          <div className="col-12 col-md-4">
            <div className="card h-85">
              <img src="../src/assets/Sleepacc.png" className="card-img-top img-fluid" alt="Sleep Metrics Graphic" />
              <div className="card-body">
                <h5 className="card-title">Buy Accessories</h5>
                <p className="card-text">
                  Buy the recommended sleep accessories for you , which will help you have a sound sleep
                </p>
                <a href="#" className="btn btn-primary">
                  Links
                </a>
              </div>
            </div>
          </div>

          {/* Card 3 Wrapper */}
          <div className="col-12 col-md-4">
            <div className="card h-85">
              <img src="../src/assets/Sleeparticle.png" className="card-img-top img-fluid" alt="Sleep Metrics Graphic" />
              <div className="card-body">
                <h5 className="card-title">Articles</h5>
                <p className="card-text">
                    Read the sleep related articles that are meant for you specifically
                </p>
                <a href="#" className="btn btn-primary">
                  Articles
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Sleepform;