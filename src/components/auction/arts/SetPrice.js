import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";
import { CeloDecVal } from "../../../utils";

/** The SetPrice Component */
const SetPrice = ({ save }) => {
  const [mintprice, setMintprice] = useState(null); /** MintPrice: Sets The Minting Price For An Artifact's Nft*/
  const [valid, setValid] = useState(false); /** Valid: Validate's A Valid Mint Price */
  const [show, setShow] = useState(false); /** Sets The State Of The Form Modal Display */

  //* Validates A filled Form Before It Is Submited */
  const isFormFilled = useCallback(() => {
    return valid && mintprice > 0;
  }, [valid, mintprice]);
  // close the popup modal
  const handleClose = () => setShow(false);

  // display the popup modal
  const handleShow = () => setShow(true);

  return (
    <>
      <Button
        onClick={handleShow}
        variant="danger"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Minting Price</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="border rounded bg-light">
            {valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Mint Price Is Valid ✅
              </div>
            )}
            {!valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Pls Use A Valid Mint Price.
              </div>
            )}
          </div>
          <Form>
            <FloatingLabel
              controlId="inputMintPrice"
              label="Mint Price"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Minting Price"
                onChange={(e) => {
                  setValid(Number(e.target.value) > 0);
                  setMintprice(String(CeloDecVal(Number(e.target.value))));
                }}
              />
            </FloatingLabel>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              save(mintprice);
              handleClose();
            }}
          >
            Set Minting Price
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

SetPrice.propTypes = {
  // props passed into this component
  save: PropTypes.func.isRequired,
};

export default SetPrice;
