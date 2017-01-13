jQuery.sap.declare("CRUDV1.util.Formatter");

CRUDV1.util.Formatter = {
	currencyValue : function (value) {
		return parseInt(value).toFixed(0);
	}

};