
    const sizeSelect = document.getElementById('size')
    const selectQt = document.getElementById('qt-select');
    const allsum = document.getElementById('all-sticker')
    const perStickerElement = document.getElementById('per-sticker').textContent;

    function updatePerSticker() {
        const selected = sizeSelect.value;
        const number = document.getElementById('per-sticker');
        const [width, height] = selected.split('x');
        let x = Math.floor((32.9 / width)) * Math.floor((48.3 / height));
        number.textContent = Math.floor(x);
    }

    function updateAllSticker() {
        const selected = sizeSelect.value;
        const [width, height] = selected.split('x');
        let x = Math.floor((32.9 / width)) * Math.floor((48.3 / height));

        // const numSticker = parseInt(perStickerElement);
        const selectedQt = selectQt.value;
        let y = selectedQt * x;
        allsum.textContent = y;
    }



    function addSize() {
        const width = document.getElementById('widthSize').value;
        const height = document.getElementById('heightSize').value;
        const unit = document.getElementById('unitSize').value;

        let value;
        let text;

        if (unit === 'inch') {
            const calWidth = width * 2.54;
            const calheight = height * 2.54;
            value = `${calWidth}x${calheight}`;
            text = `${width} x ${height} inch (${calWidth} x ${calheight} cm)`;
        } else if (unit === 'mm') {
            const calWidth = width * 0.1;
            const calheight = height * 0.1;
            value = `${calWidth}x${calheight}`;
            text = `${width} x ${height} inch (${calWidth} x ${calheight} cm)`;
        } else if (unit === 'cm') {
            value = `${width}x${height}`;
            text = `${width} x ${height} cm`;
        }

        // Create a new option element
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        option.selected = true;
        sizeSelect.appendChild(option);
        sizeSelect.addEventListener('change', updatePerSticker);
        updatePerSticker()

    }

    function addQt() {
        const qt = document.getElementById('custom-qt').value;
        const option = document.createElement('option');
        console.log(qt);
        option.value = qt;
        option.textContent = qt + ' แผ่น';
        option.selected = true;
        selectQt.appendChild(option);
    }

    sizeSelect.addEventListener('change', updatePerSticker);
    updatePerSticker()

    sizeSelect.addEventListener('change', updateAllSticker);
    selectQt.addEventListener('change', updateAllSticker);
    updateAllSticker()


    // function calculatePrice() {
    //     const quantity = parseInt($('#floatingSelect').val());
    //     const quantityPerUnit = parseInt($('#floatingSelect option:selected').data('perUnit'));

    //     const optionPrice = parseFloat($('#option option:selected').data('price'));

    //     const totalPricePerUnit = optionPrice * quantityPerUnit;
    //     const totalPrice = totalPricePerUnit * quantity;

    //     $('#total-price').val(totalPrice.toFixed(2)); // Display the total price in the input field
    // }

    $(document).ready(() => {
        const productCate = `<%- product.categories  %>`
        $('#countSticker1, #countSticker2').hide()

        if (productCate === 'sticker') {
            $('#countSticker1, #countSticker2').show()
        }
        console.log(productCate);

        $('.form-select').change(calculatePrice);
    });


    function calculatePrice() {
        // const selectedOption = $('.radio-choice').find('option:selected');
        const selectedOption = $(this).find('option:selected').data('price'); // ราคาตัวเลือกอื่นๆ
        const optionPrice = parseFloat(selectedOption);
        var optionSum = 0;
        optionSum += optionPrice;
        const sizeTier = $('#size').find('option:selected').val(); // ขนาด
        const qtTier = $('#qt-select').find('option:selected').val(); // จำนวน
        const [width, height] = sizeTier.split('x');

        let widthprice;
        let heightprice;
        let qtprice;

        const tiers = JSON.parse('<%- JSON.stringify(tiers) %>');
        const sizes = JSON.parse('<%- JSON.stringify(sizes) %>');
        const discount = parseFloat('<%- product.discount %>') / 100
        console.log(discount);

        for (let i = 0; i < tiers.length && qtTier >= tiers[i].minqt; i++) {
            qtprice = tiers[i].priceqt;
            // if (qtTier >= tiers[i].minqt && qtTier <= tiers[i].maxqt) {
            // }
        };

        for (let j = 0; j < sizes.length; j++) {
            if (width >= sizes[j].minSize && height >= sizes[j].minSize) {
                widthprice = sizes[j].pricesize;
                heightprice = sizes[j].pricesize;
            }
        };
        // if (isNaN(quantity) || isNaN(quantityPerUnit) || isNaN(optionPrice)) {
        //     $('#total-price').val('Invalid selection');
        //     return;
        // }

        console.log(`${width} x ${height}`);
        console.log(`กว้าง : ${widthprice} บาท, ยาว : ${heightprice}`);
        console.log(`ราคาปริมาณต่อหน่วย : ${qtprice}`);
        const totalSize = widthprice + heightprice;
        const totalPricePerUnit = optionSum + totalSize + qtprice; //ราคาออฟชั่น + ราคารวมไซส์ + ราคาตามปริมาณ
        console.log(`${optionPrice}, ${totalSize}, ${qtprice}`);
        console.log(`${totalPricePerUnit} * ${qtTier}`);
        const sumPrice = (totalPricePerUnit * qtTier);
        const totalPrice = sumPrice - (sumPrice * discount)
        $('#total-price').val(totalPrice.toFixed(2));
    }

    // Update the code to set data-perUnit and data-quantity attributes in the quantity select options
    $(document).ready(() => {
        $('.form-select').change(() => {
            const selectedQuantityOption = $('#floatingSelect option:selected');
            const perUnit = selectedQuantityOption.data('perunit');
            const quantity = selectedQuantityOption.val();

            $('.radio-choice option').attr('data-perUnit', perUnit).attr('data-quantity', quantity);
        });
    });

    $(document).ready(() => {
        $('.form-select').change(function () {
            const selectedOption = $(this).find('option:selected');
            const selectedText = selectedOption.val();
            const index = $(this).closest('.mb-5').attr('id');
            // console.log('#select-option-'+index+selectedText);
            $('#select-option-' + index).text(selectedText);
        });
    });

    $(document).ready(() => {
        function updateFirstOptionImage() {
            $('.form-select').each(function () {
                const firstOption = $(this).find('option:selected');
                const optionImg = firstOption.data('img'); // Corrected access to data attribute
                const imgId = $(this).data('img-id'); // Corrected access to data attribute
                const imgElement = $('#selectedimg' + imgId);
                if (optionImg) {
                    imgElement.attr('src', optionImg);
                } else {
                    imgElement.attr('src', '/assets/img/crossed-image-icon.jpg');
                }
            });
        }

        // Call the function on page load to set the images for the first options
        updateFirstOptionImage();

        // Add an event listener to each select element with class "radio-choice"
        $('.form-select').on('change', function () {
            // Get the selected option
            const selectedOption = $(this).find(':selected');
            const optionName = selectedOption.val();
            const optionImg = selectedOption.data('img');

            // Get the corresponding image element based on the ID
            const imgId = $(this).data('img-id');
            const imgElement = $('#selectedimg' + imgId);
            // console.log('optionImg:', optionImg);
            // Update the image source with the selected option's image
            if (optionImg) {
                imgElement.attr('src', optionImg);
            } else {
                imgElement.attr('src', '/assets/img/crossed-image-icon.jpg');
            }
        });
    });
