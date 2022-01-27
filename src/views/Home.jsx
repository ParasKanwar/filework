import React from "react";
import Avatar from "./../../node_modules/@mui/material/Avatar/Avatar";
import { Grid, Button, Slider, Modal, Box, Typography, TextField, Divider, CircularProgress, ButtonBase } from "@mui/material";
import Checkbox from "./../../node_modules/@mui/material/Checkbox/Checkbox";
import Container from "./../../node_modules/@mui/material/Container/Container";
import Pagination from "@mui/material/Pagination";
import { utils, writeFile } from "xlsx";
import axios from "axios";

const PepCard = ({ pepData, onStatusChange, fileIndex, someRef }) => {
  const [status, setStatus] = React.useState(someRef.current[fileIndex] || "");
  React.useEffect(() => {
    if (status !== "") {
      onStatusChange(status, fileIndex);
    }
  }, [status, onStatusChange, fileIndex]);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.15)",
        padding: 10,
        borderRadius: 10,
      }}
    >
      <Grid container justifyItems="center" alignItems="center" spacing={2}>
        <Grid item container justifyContent="center" justifyItems="center" alignItems="center" xs={5}>
          <ButtonBase
            onClick={() => {
              const url = pepData.p1.Image_Url?.[0];
              if (url) {
                window.open(url, "_blank");
              }
            }}
          >
            <Avatar variant="rounded" src={pepData.p1.Image_Url?.[0]} style={{ width: 200, height: 200 }}>
              {pepData["Name 1"][0].toUpperCase()}
            </Avatar>
          </ButtonBase>
        </Grid>
        <Grid container justifyContent="center" item xs={2}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <code>
              {pepData.p1["Dob_Year"]?.[0] || "??"}/{pepData.p1["Dob_Month"]?.[0] || "??"}/{pepData.p1["Dob_Day"]?.[0] || "??"}
            </code>
            <code>
              {pepData.p2["Dob_Year"]?.[0] || "??"}/{pepData.p2["Dob_Month"]?.[0] || "??"}/{pepData.p2["Dob_Day"]?.[0] || "??"}
            </code>
          </div>
        </Grid>
        <Grid item container justifyContent="center" justifyItems="center" alignItems="center" xs={5}>
          <ButtonBase
            onClick={() => {
              const url = pepData.p2.Image_Url?.[0];
              if (url) {
                window.open(url, "_blank");
              }
            }}
          >
            <Avatar variant="rounded" src={pepData.p2.Image_Url?.[0]} style={{ width: 200, height: 200 }}>
              {pepData["Name 2"][0].toUpperCase()}
            </Avatar>
          </ButtonBase>
        </Grid>
        <Grid item container xs={12}>
          {pepData.positionSimilarity
            .sort((a, b) => b.score - a.score)
            .map((data) => {
              return (
                <Grid container item xs={12}>
                  <Grid item xs={5}>
                    <div
                      style={{
                        margin: 5,
                        padding: 5,
                        borderRadius: 10,
                        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      <code>{data.sentence}</code>
                    </div>
                  </Grid>
                  <Grid item xs={2}>
                    <div
                      style={{
                        background: `rgba(${100 - data.score},${data.score},0,${data.score / 100})`,
                        color: "white",
                        margin: 5,
                        padding: 5,
                        borderRadius: 10,
                        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      {data.score}
                    </div>
                  </Grid>
                  <Grid item xs={5}>
                    <div
                      style={{
                        margin: 5,
                        padding: 5,
                        borderRadius: 10,
                        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      <code>{data.match}</code>
                    </div>
                  </Grid>
                </Grid>
              );
            })}
        </Grid>
        <Grid container item xs={12} justifyContent="center">
          {["duplicate", "unique", "not to be done"].map((text) => {
            return (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <code>{text}</code>
                <Checkbox
                  color={"primary"}
                  checked={text === status}
                  onChange={(e, checked) => {
                    if (checked) {
                      setStatus(text);
                    }
                  }}
                />
              </div>
            );
          })}
        </Grid>
      </Grid>
    </div>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const CategoryToBeDeleted = {
  modification_nochange: "nochange",
  modification_untouched: "untouched",
  modification_new: "new",
  nochange_untouched: "nochange",
  nochange_new: "new",
  untouched_new: "new",
};

const idToDelete = (data) => {
  const categoryToDelete =
    CategoryToBeDeleted[`${data["ProfileType 1"].toLowerCase()}_${data["ProfileType 2"].toLowerCase()}`] ||
    CategoryToBeDeleted[`${data["ProfileType 2"].toLowerCase()}_${data["ProfileType 1"].toLowerCase()}`];
  if (categoryToDelete) {
    if (data["ProfileType 1"].toLowerCase() === categoryToDelete) {
      return data["Id 1"];
    } else if (data["ProfileType 2"].toLowerCase() === categoryToDelete) {
      return data["Id 2"];
    }
  } else {
    if ((data.p1.Position_Description?.length || 0) > (data.p2.Position_Description?.length || 0)) {
      return data["Id 2"];
    } else {
      return data["Id 1"];
    }
  }
  return undefined;
};

const PepLister = ({ pepsData }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [itemsPerCol, setItemsPerCol] = React.useState(1);
  const [currentPepsData, setPepsData] = React.useState(pepsData || []);
  const [ouputJSONUrl, setOuputJSON] = React.useState("");
  const [openModal, setModal] = React.useState(false);
  const [loadingJSON, setLoadingJSON] = React.useState(false);
  const handleOpenJSON_URL_MODAL = () => {
    setModal(true);
  };
  const handleCloseJSON_URL_MODAL = () => {
    setModal(false);
  };
  const ref = React.useRef({});
  const jobStatusChange = (status, fileIn) => {
    ref.current[fileIn] = status;
    console.log(ref.current);
  };
  const perPage = 10;
  const onExport = () => {
    const sheet = utils.json_to_sheet(
      currentPepsData.map((a) => {
        const toRet = {
          ...a,
          p1: null,
          p2: null,
          positionSimilarity: null,
          status: ref.current[a.index],
          "uid to be deleted": ref.current[a.index] === "duplicate" ? idToDelete(a) : undefined,
        };
        delete toRet.p1;
        delete toRet.p2;
        delete toRet.positionSimilarity;
        delete toRet.index;
        return toRet;
      })
    );
    const wb = utils.book_new();
    utils.book_append_sheet(wb, sheet, "duplicate");
    writeFile(wb, "duplicate.xlsx");
  };
  return (
    <>
      <Modal
        open={openModal}
        onClose={handleCloseJSON_URL_MODAL}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Enter Output JSON URL
          </Typography>
          <TextField
            id="outlined-basic"
            label="JSON URL"
            variant="standard"
            value={ouputJSONUrl}
            fullWidth
            onChange={(e) => {
              setOuputJSON(e.target.value);
            }}
          />
          <Divider style={{ marginTop: 10, marginBottom: 10 }} />
          <Button
            variant="outlined"
            style={{ width: 150, height: 40 }}
            onClick={() => {
              if (!loadingJSON) {
                setLoadingJSON(true);
                axios
                  .get(ouputJSONUrl)
                  .then(({ data }) => {
                    setPepsData(data.map((d, idx) => ({ ...d, index: idx })));
                    setCurrentIndex(0);
                    setModal(false);
                  })
                  .catch((err) => {
                    console.log(err.message);
                  })
                  .finally(() => {
                    setLoadingJSON(false);
                  });
              }
            }}
          >
            {loadingJSON ? <CircularProgress style={{ width: 20, height: 20 }} /> : "Load JSON"}
          </Button>
        </Box>
      </Modal>
      <div
        style={{
          position: "fixed",
          top: 0,
          padding: 10,
          width: "100%",
          height: 40,
          display: "flex",
          background: "white",
          zIndex: 2,
          boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ height: "100%", width: "100%" }}>
          <Grid container justifyContent="center">
            <Grid container justifyContent="center" alignItems="center" item xs={4}>
              <div style={{ width: 50 }}>
                <Slider
                  marks
                  min={1}
                  max={3}
                  step={1}
                  onChange={(e, val) => {
                    setItemsPerCol(val);
                  }}
                />
              </div>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" item xs={4}>
              <Pagination
                page={currentIndex + 1}
                count={Math.floor(currentPepsData.length / perPage)}
                onChange={(e, pgn) => {
                  document.body.scrollTop = document.documentElement.scrollTop = 0;
                  setCurrentIndex(pgn - 1);
                }}
                color="primary"
              />
            </Grid>
            <Grid container justifyContent="center" alignItems="center" item xs={4}>
              <Button color="secondary" onClick={handleOpenJSON_URL_MODAL} variant="contained">
                Upload Another JSON
              </Button>
            </Grid>
          </Grid>
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          padding: 10,
          width: "100%",
          height: 40,
          background: "white",
          zIndex: 2,
          boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Button onClick={onExport} variant="contained">
          Export Excel File
        </Button>
      </div>
      <Container maxWidth="xl" style={{ marginTop: 80, marginBottom: 80 }}>
        <Grid container spacing={4}>
          <Grid container item xs={12} spacing={4}>
            {currentPepsData.length === 0 && <h1>No data to display</h1>}
            {currentPepsData.slice(perPage * currentIndex, perPage * (currentIndex + 1)).map((pepData) => (
              <Grid key={pepData.index} item xs={12 / itemsPerCol}>
                <PepCard someRef = {ref} pepData={pepData} onStatusChange={jobStatusChange} fileIndex={pepData.index} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default function Home() {
  return (
    <div>
      <PepLister />;
    </div>
  );
}
