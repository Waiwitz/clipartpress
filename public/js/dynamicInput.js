$('#add-spec').on('click', function () {
    specCount++;
    img++
    var newSpecCard = `
<div class="card mb-4 newcard spec" id="spec${specCount}">
<div class="card-body">
<div class="d-flex justify-content-between border-bottom mb-3">
  <div class="form-outline mb-3" style="width: 200px;">
    <input type="text" name="spec_name[${specCount}][]" class="spec-name form-control" required>
    <label class="form-label">ชื่อสเปค</label>
  </div>
  <button type="button" class="btn btn-danger remove-spec">ลบ</button>
</div>
<div class="sub-options mb-4">
  <div class="sub-option-row">
    <div class="row row-cols-lg-auto mb-4">
        <div class="col">
            <div class="option-img">
                <i class="fa-solid fa-plus"></i>
                    <input type="file"
                                    onchange="previewImage(event, [${img}])" accept="image/png, image/jpeg" />
                    <img src="" alt="profile" id="option_preview[${img}]" draggable="false">
            </div>
        </div>
      <div class="col">
        <div class="form-outline">
          <input type="text" name="sub_options[${specCount}][]" class="sub-option-name form-control" required>
          <label class="form-label">ชื่อตัวเลือก</label>
        </div>
        <div class="form-outline">
          <input type="number" name="sub_option_prices[${specCount}][]" class="sub-option-price form-control" required>
          <label class="form-label">ราคาต่อหน่วย</label>
        </div>
      </div>
      <button type="button" class="btn btn-secondary" id="add-sub-btn">เพิ่มตัวเลือก</button>
    </div>
  </div>
</div>
</div>
</div>
`;

    $('#newRow').append(newSpecCard);
});

// ลบแถวหลัก
$('#newRow').on('click', '.remove-spec', function () {
    $(this).closest(`.newcard`).remove();
});

// เพิ่มแถวย่อย
$('#add-sub-btn').click(function () {
    img++
    var specId = $(this).closest('.card').attr('id');
    var specCount = $(this).closest('.card').index('.card');
    console.log(specCount)
    var subOptionCount = $('#' + specId + ' .spec').length;

    var newSubOption = `
<div class="sub-option-row">
<div class="row row-cols-lg-auto mb-4">
<div class="col">
    <div class="option-img">
        <i class="fa-solid fa-plus"></i>
        <input type="file"
        onchange="previewImage(event, [${img}])" accept="image/png, image/jpeg" />
        <img src="" alt="profile" id="option_preview[${img}]" draggable="false">
    </div>
    </div>
<div class="col">
  <div class="form-outline">
    <input type="text" name="sub_options[${specCount}][]" class="sub-option-name form-control" required>
    <label class="form-label">ชื่อตัวเลือก</label>
    <div class="form-outline">
          <input type="number" name="sub_option_prices[${specCount}][]" class="sub-option-price form-control" required>
          <label class="form-label">ราคาต่อหน่วย</label>
        </div>
  </div>
</div>
<button type="button" class="btn btn-danger remove-sub-option" data-spec-id="${specCount}">ลบ</button>
</div>
</div>
`;
    $('#' + specId + ' .sub-options').append(newSubOption);

    // ลบแถวย่อย
    $('.sub-options').on('click', '.remove-sub-option', function () {
        $(this).closest(`.sub-option-row`).remove();
    });
});