'use strict';
/*global Modernizr:true */
var CGraph = CGraph || {};

CGraph.keyStorage = (function() {
  var save = function(key, jsonData, expirationMin){
    var expirationMS = expirationMin * 60 * 1000;
    var record = {value: JSON.stringify(jsonData), timestamp: new Date().getTime() + expirationMS};
    if(Modernizr.localstorage){
      localStorage.setItem(key, JSON.stringify(record));
    }else{
      window.alert('Por favor actualice su navegador save');
    }
    return jsonData;
  };

  var load = function(key){
    var record;
    if(Modernizr.localstorage){
      record = JSON.parse(localStorage.getItem(key));
    }else{
      window.alert('Por favor actualice su navegador load');
    }
    if (!record){return false;}
    return (new Date().getTime() < record.timestamp && JSON.parse(record.value));
  };

  return {
    save: save,
    load: load
  };
})();

CGraph.dataService = (function() {
  var base = 'http://localhost:9000/datos';
  var serviceBase = base + '/doc/';
  var serviceAuth = base + '/oauth/';
  var requestToken = 'ZjZhYmMzYTctMGZmOC00OGE1LTg0YzItYTZkZGNiZGZjMjA4Ojg2ZGIxY2UxLTRiMzUtNDhhOC1iNzY5LTk4Yjk0YzBmM2FhNA==';
  var requests = [];

  var getAccessToken = function(callback){
    var promise, self = this;
    var currentToken = CGraph.keyStorage.load('access_token');
    if(currentToken){
      //console.log('Token con localStorage');
      promise = callback(currentToken);
      requests.push(promise);
      return promise;
    }else{
      $.ajax({
        dataType: 'json',
        type: 'POST',
        url: serviceAuth + 'token',
        headers: {'Authorization': 'Basic ' + requestToken},
        success: function (data) {
          //console.log('Token con AJAX');
          CGraph.keyStorage.save('access_token', data.access_token, 14);
          promise = callback(data.access_token);
          requests.push(promise);
          return promise;
        }
      });
    }
    //console.log(pendingRequests);
  };

  var getPlanificacion = function(id){
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: serviceBase + 'planificaciones/' + id,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0];
          return JSON.stringify(jsonData);
        }
      });
    });
  };

  var getConvocatorias = function(url){
    url = url.replace('https://www.contrataciones.gov.py/datos', base); //Dev only
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: url,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0].convocatoria.list;
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var getConvocatoria = function(id){
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: serviceBase + 'convocatorias/' + id,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0];
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var getAdjudicaciones = function(url){
    url = url.replace('https://www.contrataciones.gov.py/datos', base); //Dev only
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: url,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0].adjudicacion.list;
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var getAdjudicacion = function(id){
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: serviceBase + 'adjudicaciones/' + id,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0];
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var getContratos = function(url){
    url = url.replace('https://www.contrataciones.gov.py/datos', base); //Dev only
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: url,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0].contrato.list;
          return JSON.stringify(jsonData);
        }
      });
    });

  }

  var getContrato = function(id){
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: serviceBase + 'contratos/' + id,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0];
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var getModificacionesContrato = function(url){
    url = url.replace('https://www.contrataciones.gov.py/datos', base); //Dev only
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: url,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0]['modificacion_contrato'].list;
          return JSON.stringify(jsonData);
        }
      });
    });

  }

  var getModificacionContrato = function(id){
    return this.getAccessToken(function(accessToken){
      return $.ajax({
        dataType: "json",
        type: "GET",
        url: serviceBase + 'modificaciones-contrato/' + id,
        headers: {'Authorization': 'Bearer ' + accessToken},
        dataFilter: function(data){
          var jsonData = JSON.parse(data)['@graph'][0];
          return JSON.stringify(jsonData);
        }
      });
    });
  }

  var _fetchAll = function(baseCollection, service, attr){
    var self = this;
    baseCollection = _.flatten(baseCollection);
    var result = [];
    var d = $.Deferred();
    if(baseCollection.length === 0) d.resolve([]);
    var promises = _.map(baseCollection, function(e){ return service.call(self, e[attr]); });
    var resolve = _.after(promises.length, function(){ d.resolve(result); });
    _.each(promises, function(p){
      p.done(function(e, i){ result.push(e); }).always(resolve);
    });
    return d;
  }

  var fetchNodos = function(id){
    var planificacionResult, convocatoriasResult, adjudicacionesResult, contratosResult, modificacionesResult;
    var self = this;
    return $.when(self.getPlanificacion(id))
    .then(function(pac){
      planificacionResult = pac;
      return $.Deferred().resolve(pac.convocatorias);
    })
    .then($.proxy(self.getConvocatorias, self))
    .then(function(convocatorias){ return _fetchAll.call(self, convocatorias, self.getConvocatoria, 'id'); })
    .then(function(convocatorias){
      convocatoriasResult = convocatorias;
      return _fetchAll.call(self, convocatorias, self.getAdjudicaciones, 'adjudicaciones');
    }).then(function(adjudicaciones){ return _fetchAll.call(self, adjudicaciones, self.getAdjudicacion, 'id'); })
    .then(function(adjudicaciones){
      adjudicacionesResult = adjudicaciones;
      return _fetchAll.call(self, adjudicaciones, self.getContratos, 'proveedores_adjudicados');
    })
    .then(function(contratos){ return _fetchAll.call(self, contratos, self.getContrato, 'id'); })
    .then(function(contratos){
      contratosResult = contratos;
      return _fetchAll.call(self, contratos, self.getModificacionesContrato, 'modificaciones_contrato');
    })
    .then(function(modificaciones){ return _fetchAll.call(self, modificaciones, self.getModificacionContrato, 'id'); })
    .then(function(modificaciones){
      var d = $.Deferred();
      modificacionesResult = modificaciones;
      d.resolve(planificacionResult, convocatoriasResult, adjudicacionesResult, contratosResult, modificacionesResult);
      return d;
    });
  };

  var fetchPlanificacionTree = function(id){
    return this.fetchNodos(id).then(function(planificacion, convocatorias, adjudicaciones, contratos, modificaciones){
      var d = $.Deferred();
      _.each(contratos, function(c){
        c.modificaciones_contrato = _.filter(modificaciones, function(m){ return m.contrato_id === c.id; });
      });
      _.each(adjudicacionesResult, function(a){
        a.contratos = _.filter(contratos, function(c){ return c.adjudicacion_id === a.id; });
      });
      _.each(convocatorias, function(c){
        c.adjudicaciones = _.filter(adjudicaciones, function(a){ return a.convocatoria_id === c.id; });
      });
      planificacion.convocatorias = convocatorias;
      d.resolve(planificacion);
      return d;
    });
  };

  return {
    getAccessToken : getAccessToken,
    getPlanificacion : getPlanificacion,
    getConvocatorias : getConvocatorias,
    getConvocatoria : getConvocatoria,
    getAdjudicaciones : getAdjudicaciones,
    getAdjudicacion : getAdjudicacion,
    getContratos : getContratos,
    getContrato : getContrato,
    getModificacionesContrato : getModificacionesContrato,
    getModificacionContrato : getModificacionContrato,
    fetchNodos : fetchNodos,
    fetchPlanificacionTree : fetchPlanificacionTree
  };
})();

CGraph.graphService = (function() {
  var getTree = function(id){
    console.time('fetchLlamado');
    return CGraph.dataService.fetchNodos(id)
      .then(function(planificacion, convocatorias, adjudicaciones, contratos, modificaciones){
        var d = $.Deferred();
        var root = {
                    'name': 'Planificación',
                    'fechaEstimada': 'Estimada ' + moment(planificacion['fecha_estimada'], 'YYYY-MM-DD').format('L'),
                    'nodeId': planificacion.id
                  }

        var nodosConvocatorias = _.map(convocatorias, function(c){
          return {
            'name': 'Convocatoria',
            'fechaPublicacion': (c['fecha_publicacion']) ? moment(c['fecha_publicacion'], 'YYYY-MM-DD').format('L') : '',
            'estado': c.estado.nombre,
            'nodeId': c.id,
            'planificacionId': c['planificacion_id']
          }
        });

        var nodosAdjudicaciones = _.map(adjudicaciones, function(a){
          return {
            'name': 'Adjudicación',
            'fechaPublicacion': (a['fecha_publicacion']) ? moment(a['fecha_publicacion'], 'YYYY-MM-DD').format('L') : '',
            'nodeId': a.id,
            'convocatoriaId': a['convocatoria_id']
          }
        });

        var nodosContratos = _.map(contratos, function(c){
          return {
            'name': 'Contrato',
            'fechaFirmaContrato': moment(c['fecha_firma_contrato'], 'YYYY-MM-DD').format('L'),
            'proveedor': c.proveedor['razon_social'],
            'estado': c.estado.nombre,
            'monto': c.moneda.codigo + ' ' + c['monto_adjudicado'].toLocaleString(),
            'nodeId': c.id,
            'adjudicacionId': c['adjudicacion_id']
          }
        });
        var nodosModificaciones = _.map(modificaciones, function(m){
          //console.log(m);
          return {
            'name': m.tipo,
            'fecha': moment().format('L'),
            'estado': m.estado.nombre,
            'monto': (m.monto) ? m.moneda.codigo + ' ' + m['monto'].toLocaleString() : '',
            'nodeId': m.id,
            'contratoId': m['contrato_id']
          }
        });

        _.each(nodosContratos, function(c){
          c.children = _(nodosModificaciones).filter(function(m){ return m.contratoId === c.nodeId; })
                                              .sortBy(function(m){ return moment(m.fecha, 'DD-MM-YYYY'); })
                                              .value();
        });

        _.each(nodosAdjudicaciones, function(a){
          a.children = _(nodosContratos).filter(function(c){ return c.adjudicacionId === a.nodeId; })
                                          .sortBy(function(c){ return moment(c.fechaFirmaContrato, 'DD-MM-YYYY'); })
                                          .value();
        });

        _.each(nodosConvocatorias, function(c){
          c.children = _(nodosAdjudicaciones).filter(function(a){ return a.convocatoriaId === c.nodeId; })
                                              .sortBy(function(a){ return moment(c.fechaPublicacion, 'DD-MM-YYYY'); })
                                              .value();
        });

        root.children = _.sortBy(nodosConvocatorias, function(c){ return moment(c.fechaPublicacion, 'DD-MM-YYYY'); });
        console.log(root);
        d.resolve(root);
        console.timeEnd('fetchLlamado');
        return d;
    });
  };

  return {
    getTree : getTree
  };
})();

/*$(document).ready(function(){
  CGraph.graphService.getTree('193399-adquisicion-scanner').then(function(llamadoTree){
    console.log(JSON.stringify(llamadoTree, null, 2));
  });
});*/
