/* eslint-disable react/jsx-filename-extension */
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";
import { uploadArtifactFile } from "../../../utils/artifact";
import { CeloDecVal } from "../../../utils";

/* Attributes That Can Be Added To An Artifacts Nft */
const ARTIFACT_VALUE = ["Common", "Rear", "Very_Rear"];
const ARTIFACT_TYPE = [
  "Sculpture",
  "Jewelry",
  "Potriat",
  "Casting",
  "Carving",
  "Painting",
  "Others",
];
/** The AddArtifacts Component */
const AddArtifacts = ({ save, address }) => {
  const [artname, setArtName] = useState(""); /* Artname: Artifact's Nft Name */
  const [ipfsArtAlias, setIpfsArtAlias] = useState(""); /* IpfsArtAlias: Artifact's Nft ipfsalias */
  const [description, setDescription] = useState(""); /* Description: Artifact's Nft description */
  const [auctiondate, setAuctiondate] = useState(Date()); /* Auctiondate: Artifact's Nft Auctiondate */
  const [firstprice, setFirstprice] = useState(0); /* Firstprice: Artifact's Nft firstprice */
  const [valid, setValid] = useState(false); /* Vaiddate: Artifact's Nft valid date state*/

  const [attributes, setAttributes] = useState([]); /* Attributes: An Array Of Attributes For An Artifact's Nft */
  const [show, setShow] = useState(false); /** Sets The State Of The Form Modal Display */

  /* Define A Valid Auction Time */
  var _valid = new Date();
  _valid = new Date(_valid.setHours(_valid.getHours() + 1));

    /* Validates A Form Is filled Before It's Submited */
  const isFormFilled = useCallback(() => {
    return (
      artname &&
      valid &&
      auctiondate &&
      firstprice > 0 &&
      ipfsArtAlias &&
      description &&
      attributes.length > 1
    );
  }, [
    artname,
    valid,
    auctiondate,
    firstprice,
    ipfsArtAlias,
    description,
    attributes,
  ]);
  // close the popup modal
  const handleClose = () => {
    setShow(false);
    setAttributes([]);
  };

  // display the popup modal
  const handleShow = () => setShow(true);

  /*Add An Attribute To The Artifacts Nft */
  const setAttributesFunc = (e, option) => {
    const { value } = e.target;
    const attributeObject = {
      option,
      value,
    };
    const arr = attributes;

    // check if attribute already exists
    const index = arr.findIndex((el) => el.option === option);

    if (index >= 0) {
      // update the existing attribute
      arr[index] = {
        option,
        value,
      };
      setAttributes(arr);
      return;
    }

    // add a new attribute
    setAttributes((oldArray) => [...oldArray, attributeObject]);
  };

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
          <Modal.Title>Create Artifact</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="border rounded bg-light">
            {valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Auction Date Is Valid ✅
              </div>
            )}
            {!valid && (
              <div className="text-secondary fw-lighter small text-capitalize">
                Auction Date Is inValid Use a Date Or Time Ahead of Now.
              </div>
            )}
          </div>
          <Form>
            <FloatingLabel
              controlId="inputLocation"
              label="Name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Name of Artifact"
                onChange={(e) => {
                  setArtName(e.target.value);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputDescription"
              label="Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>

            <Form.Control
              type="file"
              className={"mb-3"}
              onChange={async (e) => {
                const imageUrl = await uploadArtifactFile(e);
                if (!imageUrl) {
                  alert("failed to upload image");
                  return;
                }
                setIpfsArtAlias(imageUrl);
              }}
              placeholder="Artifact Image"
            />
            <Form.Label>
              <h5>Atributes</h5>
            </Form.Label>
            <Form.Control
              as="select"
              className={"mb-3"}
              onChange={async (e) => {
                setAttributesFunc(e, "art_value");
              }}
              placeholder="Artifact Value"
            >
              <option hidden>Artifact Value</option>
              {ARTIFACT_VALUE.map((art_value) => (
                <option
                  key={`artifact_value-${art_value.toLowerCase()}`}
                  value={art_value.toLowerCase()}
                >
                  {art_value}
                </option>
              ))}
            </Form.Control>

            <Form.Control
              as="select"
              className={"mb-3"}
              onChange={async (e) => {
                setAttributesFunc(e, "type");
              }}
              placeholder="Artifact Type"
            >
              <option hidden>Artifact Type</option>
              {ARTIFACT_TYPE.map((type) => (
                <option
                  key={`artifact_type-${type.toLowerCase()}`}
                  value={type.toLowerCase()}
                >
                  {type}
                </option>
              ))}
            </Form.Control>

            <FloatingLabel
              controlId="inputAuctionDateTime"
              label="Auction Date and Time"
              className="mb-3"
            >
              <Form.Control
                type="datetime-local"
                data-mdb-inline="true"
                placeholder="Auction Date and Time"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setAuctiondate(e.target.value);
                  setValid(new Date(Date.parse(e.target.value)) > _valid);
                }}
              />
            </FloatingLabel>

            <FloatingLabel
              controlId="inputfirstprice"
              label="Artifact Price"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Price of Artifact"
                onChange={(e) => {
                  setFirstprice(Number(e.target.value));
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
              save({
                artname,
                ipfsArtAlias,
                auctiondate,
                description,
                firstprice,
                ownerAddress: address,
                attributes,
              });
              handleClose();
            }}
          >
            Create ART
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

AddArtifacts.propTypes = {
  // props passed into this component
  save: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
};

export default AddArtifacts;
