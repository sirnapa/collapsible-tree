CGraph.treeBuilder = function(llamadoTree){
  var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 1060 - margin.right - margin.left,
    height = 700 - margin.top - margin.bottom;
    
  var i = 0,
      duration = 750,
      root;

  var tree = d3.layout.tree()
      .size([height, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var svg, spinner;
  function setUp(){
    svg = d3.select("#viz-container").append("svg")
        .attr("class", "fondo-gris")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  };

  function showTree(id){
    d3.select("svg").remove();
    var target = document.getElementById('viz-container');
    if(!spinner){
      spinner = new Spinner({
        lines: 13,
        length: 20,
        width: 10,
        radius: 30,
        color: '#fff'
      });
    }
    spinner.stop();
    spinner.spin(target);
    
    CGraph.graphService.getTree(id).then(function(llamadoTree){
      drawTree(llamadoTree);
      spinner.stop();
    });
  }

  function drawTree(llamadoTree){
    setUp();
    root = llamadoTree;
    root.x0 = height / 2;
    root.y0 = 0;

    function collapse(d) {
      if (d.children && d.children.length > 0) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    //root.children.forEach(collapse);
    update(root);
  }


  function contentByNode(nodo){
    var source, template, context, content = 'Probando';
    switch(nodo.depth){
      case 0:
        source  = $("#nodo-planificacion").html();
        context = {titulo: nodo.name, fecha: nodo.fechaEstimada};
        break;

      case 1:
        source = $("#nodo-convocatoria").html();
        context = {titulo: nodo.name, fecha: nodo.fechaPublicacion, estado: nodo.estado};
        break;

      case 2:
        source = $("#nodo-adjudicacion").html();
        context = {titulo: nodo.name, fecha: nodo.fechaPublicacion};
        break;

      case 3:
        source = $("#nodo-contrato").html();
        context = {titulo: nodo.name, fecha: nodo.fechaFirmaContrato, estado: nodo.estado, proveedor: nodo.proveedor, monto: nodo.monto};
        break;

      case 4:
        console.log(nodo);
        source = $("#nodo-ampliacion").html();
        context = {titulo: nodo.name, fecha: nodo.fecha, estado: nodo.estado, monto: nodo.monto};
        break;
    }

    if(context.estado){
      context.rojo = _.contains(['Cancelado', 'Anulado', 'Desierto'], context.estado);
      context.naranja = _.contains(['Suspendido', 'Impugnado'], context.estado);
      context.verde = _.contains(['Adjudicado', 'Ejecutado', 'Publicado'], context.estado);
    }
    template = Handlebars.compile(source);
    content = template(context);
    
    return content;
  }

  function widthByNode(nodo){
    var width = 142;
    //Contrato
    if(nodo.depth === 3){
      width = 274;
    }
    return width;
  }

  function yOffsetByNode(nodo){
    var yOffset = -71;
    //Contrato
    if(nodo.depth === 3){
      yOffset = -50;
    }
    return yOffset;
  }

  function buildTree(niter){
    // Compute the new tree layout.
    niter = niter = niter || 0;
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);    
    var treeHeight = height + niter * 50;
    
    tree = d3.layout.tree().size([treeHeight, width]);
    var minNodeSpacing = _.reduce(nodes, function(min, node, i, nodes){
      var spacing;
      if(i + 1 < nodes.length && node.depth === nodes[i + 1].depth){
        spacing = Math.abs(node.x - nodes[i + 1].x);
        min = (spacing < min) ? spacing : min;
      }
      return min;
    }, height);

    if (minNodeSpacing < 140){
      //Iterate until minimum required height is found
      return buildTree(niter + 1);
    }else{
      return {
        nodes: nodes,
        links: links,
        height: treeHeight
      };
    }
  }

  function update(source) {
    var treeElems = buildTree();
    var nodes = treeElems.nodes;
    var links =  treeElems.links;

    d3.select('svg')
      .attr("height", treeElems.height + margin.top + margin.bottom);

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);
    
    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      var offset = (d.depth === 4) ? 125 : 0;
      d.y = d.depth * 180 + offset; 
    });
    console.log(nodes);
    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append('foreignObject')
        .attr("x", -71)
        .attr("y", yOffsetByNode)
        .attr("width", widthByNode)
        .attr("height", 142)
        .append("xhtml:div")
        .html(contentByNode);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("fill", "white")
        .attr("stroke-width", "10px")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  return {showTree: showTree};

}();


$(document).ready(function(){
  //Remote
  CGraph.treeBuilder.showTree('272219-adquisicion-softwares');
  $('input').keypress(function (e){
    if (e.which == 13) {
      CGraph.treeBuilder.showTree($('input').val());
      return false;
    }
  });

  $('.btn').on('click', function(){
    console.log($('input').val());
    CGraph.treeBuilder.showTree($('input').val());
    return false;
  });


  /*d3.json('scripts/llamado.json', function(llamadoTree){
    drawTree(llamadoTree);
  });*/
});