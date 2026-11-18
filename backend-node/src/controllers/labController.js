const service = require("../services/labService");

async function getAllRequests(req, res, next) {
  try {
    const data = await service.getAllRequests();

    return res.status(200).json({
      success: true,
      message: "Daftar permintaan lab berhasil diambil.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getRequestById(req, res, next) {
  try {
    const data = await service.getRequestById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Detail permintaan lab berhasil diambil.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function submitResult(req, res, next) {
  try {
    const data = await service.submitResult(req.body);

    return res.status(201).json({
      success: true,
      message: "Hasil pemeriksaan lab berhasil disimpan.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  submitResult,
};
